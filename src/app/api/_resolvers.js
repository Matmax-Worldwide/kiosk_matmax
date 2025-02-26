import { Prisma } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid';
import { DateTimeResolver } from 'graphql-scalars';
import cronParser from 'cron-parser';

import prisma from './_prisma.ts';

import { triggerWebhooks } from './_webhook.js';
// import { apiKeyManager } from './_apiKeyManager.ts';

import handleBundleUsageEvent from './_bundleUsageEventHandler.js'
import calculateBundleRemainingUses from './_calculateBundleRemainingUses.js';

const resolvers = {
    Query: {
        agency: (_, { id }) => prisma.agency.findUnique({ where: { id } }),
        agencies: (_, { status }) => prisma.agency.findMany({ where: status ? { status } : undefined }),
        agent: (_, { id }) => prisma.agent.findUnique({ where: { id } }),
        agents: (_, { status }) => prisma.agent.findMany({ where: status ? { status } : undefined }),
        context: (_, { id }) => prisma.context.findUnique({ where: { id } }),
        contexts: (_, { agencyId }) => prisma.context.findMany({ where: { agencyId } }),
        timeSlot: (_, { id }) => prisma.timeSlot.findUnique({ where: { id } }),
        timeSlots: (_, { agentId, contextId, sessionTypeId }) => prisma.timeSlot.findMany({
            where: {
                ...(agentId && { agentId }),
                ...(contextId && { contextId }),
                ...(sessionTypeId && { sessionTypeId }),
            },
        }),
        nextTimeSlot: async (_, { contextId, currentTime }) => {
            const now = new Date(currentTime);

            const timeSlots = await prisma.timeSlot.findMany({
                where: {
                    contextId,
                }
            });

            let nextSlot = null;
            let minTime = null;

            timeSlots.forEach((timeSlot) => {
                try {
                    const interval = cronParser.parseExpression(timeSlot.cron, {
                        // set day to the latest of startDate and today
                        currentDate: now,
                        tz: 'America/Lima'
                    });
                    const nextExecution = interval.next().toDate();

                    if (
                        nextExecution >= now &&
                        (!minTime || nextExecution < minTime)
                    ) {
                        minTime = nextExecution;
                        nextSlot = { ...timeSlot, startTime: nextExecution };
                    }
                } catch (e) {
                    console.error(`Error parsing cron for timeSlot ID ${timeSlot.id}:`, e);
                }
            });

            return nextSlot;
        },
        allocation: async (_, { input: { id, timeSlotId, startTime } }) => {
            console.log('🔍 [Server] Looking up allocation...', { id, timeSlotId, startTime });
            try {
                let allocation;
                if (id) {
                    console.log('🔍 [Server] Searching by ID:', id);
                    allocation = await prisma.allocation.findUnique({ where: { id } });
                } else if (timeSlotId && startTime) {
                    console.log('🔍 [Server] Searching by timeSlotId and startTime:', { timeSlotId, startTime });
                    allocation = await prisma.allocation.findFirst({
                        where: {
                            timeSlotId,
                            startTime: new Date(startTime),
                        },
                    });
                }
                console.log('📝 [Server] Allocation lookup result:', allocation);
                return allocation;
            } catch (error) {
                console.error('❌ [Server] Error looking up allocation:', error);
                throw error;
            }
        },
        allocations: async (_, { contextId, status }) => {
            console.log('🔍 [Server] Fetching allocations...', { contextId, status });
            try {
                const allocations = await prisma.allocation.findMany({
                    where: {
                        ...(status && { status }),
                        timeSlot: {
                            contextId,
                        },
                    },
                });
                console.log('📝 [Server] Found allocations count:', allocations.length);
                return allocations;
            } catch (error) {
                console.error('❌ [Server] Error fetching allocations:', error);
                throw error;
            }
        },
        possibleAllocations: async (_, { contextId, startDate, endDate }) => {
            console.log('🔍 [Server] Fetching possible allocations...', { contextId, startDate, endDate });
            try {
                // Get all time slots for the given context with their effective duration
                const timeSlots = await prisma.timeSlot.findMany({
                    where: { contextId },
                    include: { sessionType: true, allocations: true, agent: true },
                });
                console.log('📝 [Server] Found timeSlots count:', timeSlots.length);

                const possibleAllocations = timeSlots.flatMap(timeSlot => {
                    console.log('⚙️ [Server] Processing timeSlot:', {
                        id: timeSlot.id,
                        cron: timeSlot.cron,
                    });

                    // Generate all occurrences for the requested time frame
                    const interval = cronParser.parseExpression(timeSlot.cron, {
                        currentDate: new Date(startDate),
                        tz: 'America/Lima'
                    });
                    const effectiveDuration = timeSlot.duration || timeSlot.sessionType.defaultDuration;

                    const occurrences = [];
                    while (true) {
                        const event = interval.next();

                        if (event.getTime() > new Date(endDate).getTime()) {
                            break;
                        }

                        occurrences.push(new Date(event.getTime()));
                    }

                    console.log('📝 [Server] Generated occurrences count:', occurrences.length);
                    return occurrences.map(startTime => {
                        return {
                            id: timeSlot.allocations.find(allocation => allocation.startTime.getTime() === startTime.getTime())?.id,
                            startTime,
                            duration: effectiveDuration,
                            status: 'AVAILABLE',
                            timeSlotId: timeSlot.id,
                            sessionTypeId: timeSlot.sessionType.id,
                            currentReservations: timeSlot.allocations.find(allocation => allocation.startTime.getTime() === startTime.getTime())?.currentReservations || 0,
                        };
                    });
                });

                console.log('✅ [Server] Total possible allocations:', possibleAllocations.length);
                return possibleAllocations.flat().sort((a, b) => a.startTime - b.startTime);
            } catch (error) {
                console.error('❌ [Server] Error generating possible allocations:', error);
                throw error;
            }
        },
        sessionType: (_, { id }) => prisma.sessionType.findUnique({ where: { id } }),
        sessionTypes: () => prisma.sessionType.findMany(),
        session: (_, { id }) => prisma.session.findUnique({ where: { id } }),
        sessions: (_, { agentId, status }) => prisma.session.findMany({
            where: {
                ...(agentId && { agentId }),
                ...(status && { status }),
            },
        }),
        consumer: (_, { id }) => prisma.consumer.findUnique({ where: { id }, include: { bundles: true } }),
        consumers: async (_, { filters, orderBy }) => {
            const where = {
                isDeleted: filters?.includeDeleted ? undefined : false,
                status: filters?.statuses?.length > 0 ? { in: filters.statuses } : undefined,
                tags: filters?.tags?.length > 0 ? { some: { name: { in: filters.tags } } } : undefined,
            };

            const order = orderBy ? { [orderBy.field]: orderBy.direction } : undefined;

            return prisma.consumer.findMany({
                where,
                orderBy: order,
            });
        },
        searchConsumers: async (_, { query, limit = 10 }) => {
            const fullNameQuery = query.trim();
            return prisma.consumer.findMany({
                where: {
                    OR: [
                        { firstName: { contains: query, mode: 'insensitive' } },
                        { lastName: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                        {
                            AND: [
                                { firstName: { contains: fullNameQuery.split(' ')[0], mode: 'insensitive' } },
                                { lastName: { contains: fullNameQuery.split(' ')[1] || '', mode: 'insensitive' } }
                            ]
                        }
                    ],
                    isDeleted: false
                },
                take: limit,
                orderBy: [
                    { lastName: 'asc' },
                    { firstName: 'asc' }
                ]
            });
        },
        consumersWithReservations: async () => {
            try {
                //console.log("Fetching consumers with reservations...");
                const consumers = await prisma.consumer.findMany({
                    where: {
                        reservations: {
                            some: {}, // Solo consumidores con reservas
                        },
                    }
                }
                );
                console.log("Consumers fetched:", consumers);
                return consumers;
            } catch (error) {
                console.error("Error fetching consumers with reservations:", {
                    message: error.message,
                    stack: error.stack,
                });
                throw new Error("Error fetching consumers with reservations");
            }
        },
        searchTags: async (_, { query }) => {
            const tags = await prisma.tag.findMany({
                where: {
                    name: {
                        contains: query,
                        mode: 'insensitive',
                    },
                },
                include: {
                    _count: {
                        select: { consumers: true },
                    },
                },
                orderBy: {
                    consumers: {
                        _count: 'desc',
                    },
                },
                take: 10, // Limit to top 10 results
            });

            return tags.map(tag => ({
                id: tag.id,
                name: tag.name,
                count: tag._count.consumers,
            }));
        },
        bundle: (_, { id }) => prisma.bundle.findUnique({ where: { id } }),
        bundles: (_, { consumerId, status }) => prisma.bundle.findMany({
            where: {
                consumerId,
                ...(status && { status }),
            },
        }),
        bundleType: (_, { id }) => prisma.bundleType.findUnique({ where: { id } }),
        bundleTypes: async () => prisma.bundleType.findMany(),
        reservation: (_, { id }) => prisma.reservation.findUnique({ where: { id } }),
        reservations: () => prisma.reservation.findMany(),
        groupReservation: (_, { id }) => prisma.groupReservation.findUnique({ where: { id } }),
        groupReservations: () => prisma.groupReservation.findMany(),

        paymentLinks: async () => {
            // Query the database using Prisma
            return prisma.paymentLink.findMany({
                orderBy: {
                    createdAt: 'desc'
                }
            })
        },
        paymentLink: async (_, { id }) => {
            return prisma.paymentLink.findUnique({ where: { id } });
        },
        paymentLinkByUrl: async (_, { url }) => {
            return prisma.paymentLink.findUnique({ where: { url } });
        },

        // async listApiKeys(_, __, context) {
        //     return await apiKeyManager.listApiKeys(context.user?.id);
        // }
    },

    Mutation: {

        createAgency: (_, { input }) => prisma.agency.create({ data: input }),
        updateAgency: (_, { id, input }) => prisma.agency.update({ where: { id }, data: input }),
        createAgent: (_, { input }) => prisma.agent.create({ data: input }),
        updateAgent: (_, { id, input }) => prisma.agent.update({ where: { id }, data: input }),
        createContext: (_, { input }) => prisma.context.create({ data: input }),
        updateContext: (_, { id, input }) => prisma.context.update({ where: { id }, data: input }),
        createTimeSlot: (_, { input }) => prisma.timeSlot.create({ data: input }),
        updateTimeSlot: (_, { id, input }) => prisma.timeSlot.update({ where: { id }, data: input }),
        createAllocation: async (_, { input }) => {
            console.log('🔨 [Server] Creating allocation...', input);
            try {
                const timeSlot = await prisma.timeSlot.findUnique({
                    where: { id: input.timeSlotId },
                    include: { sessionType: true }
                });

                if (!timeSlot) {
                    console.error('❌ [Server] TimeSlot not found:', input.timeSlotId);
                    throw new Error("TimeSlot not found");
                }

                console.log('📝 [Server] Found timeSlot:', {
                    id: timeSlot.id,
                    sessionType: timeSlot.sessionType,
                });

                // Determine the effective duration
                const effectiveDuration = timeSlot.duration || timeSlot.sessionType.defaultDuration;

                // Calculate endTime based on startTime and effectiveDuration
                const startTime = new Date(input.startTime);
                const endTime = new Date(startTime.getTime() + effectiveDuration * 60000);

                console.log('⚙️ [Server] Calculated allocation times:', {
                    startTime,
                    endTime,
                    duration: effectiveDuration,
                });

                // Use upsert instead of create to handle existing allocations
                const allocation = await prisma.allocation.upsert({
                    where: {
                        timeSlotId_startTime: {
                            timeSlotId: input.timeSlotId,
                            startTime: startTime
                        }
                    },
                    update: {
                        status: input.status || 'AVAILABLE',
                        endTime: endTime,
                    },
                    create: {
                        timeSlot: { connect: { id: input.timeSlotId } },
                        startTime: startTime,
                        endTime: endTime,
                        status: input.status || 'AVAILABLE',
                    },
                });

                console.log('✅ [Server] Allocation created/updated:', {
                    id: allocation.id,
                    status: allocation.status,
                });

                return allocation;
            } catch (error) {
                console.error('❌ [Server] Error creating allocation:', error);
                throw error;
            }
        },
        updateAllocation: async (_, { id, input }) => {
            const updatedAllocation = await prisma.allocation.update({
                where: { id },
                data: input,
                include: { reservations: { include: { bundle: true } } },
            });

            // If the allocation is cancelled, create REFUND events for all associated reservations
            if (input.status === 'CANCELLED') {
                for (const reservation of updatedAllocation.reservations) {
                    await handleBundleUsageEvent(reservation.bundle.id, reservation.id, 'REFUND', 1);
                }
            }

            return updatedAllocation;
        },
        createSessionType: (_, { input }) => prisma.sessionType.create({ data: input }),
        updateSessionType: (_, { id, input }) => prisma.sessionType.update({ where: { id }, data: input }),
        createSession: async (_, { input }) => {
            if (!input.agentId) {
                console.error("Error: agentId es obligatorio");
                throw new Error("agentId es obligatorio");
            }

            if (!input.startTime) {
                console.error("Error: startTime es obligatorio");
                throw new Error("startTime es obligatorio");
            }

            if (!input.timeSlotId) {
                console.error("Error: timeSlotId es obligatorio");
                throw new Error("timeSlotId es obligatorio");
            }

            try {
                console.log("Iniciando la creación de la sesión con input:", input);

                const result = await prisma.$transaction(async (tx) => {
                    // 1. Obtener el TimeSlot y su SessionType
                    console.log("Buscando TimeSlot con id:", input.timeSlotId);
                    const timeSlot = await tx.timeSlot.findUnique({
                        where: { id: input.timeSlotId },
                        include: { sessionType: true, agent: true },
                    });

                    if (!timeSlot) {
                        console.error("TimeSlot no encontrado");
                        throw new Error("TimeSlot not found");
                    }
                    console.log("TimeSlot encontrado:", timeSlot);

                    // Determinar la duración efectiva
                    const effectiveDuration = timeSlot.duration || timeSlot.sessionType.defaultDuration;
                    console.log("effectiveDuration calculado:", effectiveDuration);

                    // 2. Upsert Allocation
                    console.log("Upsert allocation...");
                    const allocation = await tx.allocation.upsert({
                        where: {
                            timeSlotId_startTime: {
                                timeSlotId: input.timeSlotId,
                                startTime: input.startTime,
                            },
                        },
                        update: {},
                        create: {
                            timeSlot: { connect: { id: input.timeSlotId } },
                            startTime: input.startTime,
                            endTime: new Date(new Date(input.startTime).getTime() + effectiveDuration * 60000), // Convertir minutos a ms
                            status: "AVAILABLE",
                        },
                    });
                    console.log("Allocation result:", allocation);

                    // 3. Crear la Sesión
                    console.log("Creando sesión...");
                    const session = await tx.session.create({
                        data: {
                            status: input.status,
                            agent: {
                                connect: { id: input.agentId },
                            },
                            allocation: {
                                connect: { id: allocation.id },
                            },
                        },
                    });
                    console.log("Sesión creada con ID:", session.id);

                    // 4. Crear sessionConsumers si existen en el input
                    if (input.sessionConsumers?.length > 0) {
                        console.log("Creando sessionConsumers...");
                        await tx.sessionConsumer.createMany({
                            data: input.sessionConsumers.map((consumer) => ({
                                sessionId: session.id,
                                consumerId: consumer.consumerId,
                            })),
                        });
                        console.log("sessionConsumers creados exitosamente.");
                    } else {
                        console.log("No se proporcionaron sessionConsumers en la entrada.");
                    }

                    // 5. Recuperar la sesión completa
                    console.log("Buscando sesión completa con sessionConsumers...");
                    const completeSession = await tx.session.findUnique({
                        where: { id: session.id },
                        include: {
                            agent: true,
                            allocation: true,
                            sessionConsumers: {
                                include: {
                                    consumer: true,
                                },
                            },
                        },
                    });

                    if (!completeSession) {
                        console.error("Error: No se pudo recuperar la sesión completa.");
                        throw new Error("No se pudo recuperar la sesión completa.");
                    }

                    console.log("Sesión completa recuperada exitosamente:", completeSession);
                    return completeSession;
                });

                console.log("==== [createSession] SUCCESS ====");
                return result;
            } catch (error) {
                console.error("Error creando sesión:", error);
                throw new Error(`No se pudo crear la sesión: ${error.message}`);
            }
        },
        updateSession: (_, { id, input }) => prisma.session.update({ where: { id }, data: input }),
        createConsumer: async (_, { input }) => {
            try {
                console.log("Datos recibidos en createConsumer:", input);

                const createdConsumer = await prisma.consumer.create({
                    data: input,
                });

                console.log("Usuario creado exitosamente:", createdConsumer);

                const webhookPayload = {
                    eventType: 'CONSUMER_CREATED',
                    timestamp: new Date().toISOString(),
                    consumer: {
                        id: createdConsumer.id,
                        firstName: createdConsumer.firstName,
                        lastName: createdConsumer.lastName,
                        email: createdConsumer.email,
                        phoneNumber: createdConsumer.phoneNumber,
                        status: createdConsumer.status,
                        tags: createdConsumer.tags?.map(tag => tag.name) || [], // Asegúrate de que los tags estén disponibles
                        createdAt: createdConsumer.createdAt,
                    },
                };

                console.log("webhookPayload:", webhookPayload);

                await triggerWebhooks('CONSUMER_CREATED', webhookPayload);

                return createdConsumer;
            } catch (error) {
                console.error("Error al crear el usuario:", error);
                throw new Error("No se pudo crear el usuario. Verifica los datos e inténtalo nuevamente.");
            }
        },

        updateConsumer: (_, { id, input }) => prisma.consumer.update({ where: { id }, data: input }),
        softDeleteConsumer: async (_, { id }) => {
            // Check authentication and authorization

            const updatedConsumer = await prisma.consumer.update({
                where: { id },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                },
            });

            return updatedConsumer;
        },
        addTag: async (_, { consumerId, tagName }) => {
            const consumer = await prisma.consumer.update({
                where: { id: consumerId },
                data: {
                    tags: {
                        connectOrCreate: {
                            where: { name: tagName },
                            create: { name: tagName },
                        },
                    },
                },
                include: {
                    tags: true,
                },
            });

            return consumer;
        },
        removeTag: async (_, { consumerId, tagName }) => {
            const consumer = await prisma.consumer.update({
                where: { id: consumerId },
                data: {
                    tags: {
                        disconnect: { name: tagName },
                    },
                },
                include: {
                    tags: true,
                },
            });

            return consumer;
        },
        createBundle: async (_, { input }) => {
            const { bundleTypeId, note, ...otherInputs } = input;

            const createdBundle = await prisma.bundle.create({
                data: {
                    ...otherInputs,
                    bundleTypeId: bundleTypeId,
                    ...(note ? { note } : {}) // Include note only if it exists
                },
            });

            // Fetch default items for the bundle type
            const defaultItems = await prisma.defaultBundleItem.findMany({
                where: { bundleTypeId: bundleTypeId },
            });

            // Create BundleItems based on DefaultBundleItems
            for (const defaultItem of defaultItems) {
                await prisma.bundleItem.create({
                    data: {
                        quantity: defaultItem.quantity,
                        type: defaultItem.type,
                        bundle: { connect: { id: createdBundle.id } },
                        sessionType: defaultItem.sessionTypeId
                            ? { connect: { id: defaultItem.sessionTypeId } }
                            : undefined,
                        creditAmount: defaultItem.creditAmount,
                    },
                });
            }

            // Fetch the complete bundle data including related entities
            const bundleWithRelations = await prisma.bundle.findUnique({
                where: { id: createdBundle.id },
                include: {
                    consumer: true,
                    bundleType: true,
                    bundleItems: true,
                }
            });

            // Add `noteHTML` if note exists
            const bundleWithNoteHTML = {
                ...bundleWithRelations,
                noteHTML: note ? `<div class="note"><p>${note}</p></div>` : ""
            };

            // Send a Telegram message
            const telegramMessage = `
                📦 *New Bundle Created!*
--------------------------------
*Purchase ID:* ${createdBundle.id}
*Consumer Name:* ${bundleWithRelations.consumer.firstName + " " + bundleWithRelations.consumer.lastName || 'N/A'}

*Bundle Type:* ${bundleWithRelations.bundleType.name || 'N/A'}
*Valid From:* ${new Date(bundleWithRelations.validFrom).toLocaleDateString()}
*Valid To:* ${new Date(bundleWithRelations.validTo).toLocaleDateString()}

${note || 'No additional notes'}
--------------------------------

Please review the details in the admin Dashboard.
`;


            // Prepare the payload for the webhook
            const webhookPayload = {
                eventType: 'BUNDLE_CREATED',
                timestamp: new Date().toISOString(),
                bundle: bundleWithNoteHTML,
                telegramMessage: telegramMessage
            };

            
            // Trigger the webhook with the payload and send the Telegram message
            await triggerWebhooks('BUNDLE_CREATED', webhookPayload);

            return bundleWithNoteHTML;
        },
        updateBundle: (_, { id, input }) => prisma.bundle.update({ where: { id }, data: input }),
        extendBundle: async (_, { bundleId, daysToExtend }) => {
            if (daysToExtend < 1 || daysToExtend > 15) {
                throw new Error("Invalid number of days. Please select between 1 and 15 days.");
            }

            const bundle = await prisma.bundle.findUnique({
                where: { id: bundleId },
            });

            if (!bundle) {
                throw new Error("Bundle not found.");
            }

            if (bundle.isExtended) {
                throw new Error("This bundle has already been extended and cannot be extended again.");
            }

            const updatedBundle = await prisma.bundle.update({
                where: { id: bundleId },
                data: {
                    validTo: new Date(new Date(bundle.validTo).getTime() + daysToExtend * 24 * 60 * 60 * 1000), // Add days
                    isExtended: true, // Mark as extended
                },
            });

            // Trigger the webhook if needed
            await triggerWebhooks("BUNDLE_EXTENDED", updatedBundle);

            return updatedBundle;
        },

        // Reservation
        createReservation: async (_, { input }) => {
            console.log("==== [createReservation] START ====");
            console.log("INPUT recibido:", input);

            const result = await prisma.$transaction(async (tx) => {
                // 1. Get the timeSlot and its associated session type
                console.log("Buscando TimeSlot con id:", input.timeSlotId);
                const timeSlot = await tx.timeSlot.findUnique({
                    where: { id: input.timeSlotId },
                    include: { sessionType: true, agent: true }
                });
                console.log("TimeSlot encontrado:", timeSlot);

                if (!timeSlot) {
                    console.error("TimeSlot no encontrado");
                    throw new Error('TimeSlot not found');
                }

                // Determine the effective duration
                const effectiveDuration = timeSlot.duration || timeSlot.sessionType.defaultDuration;
                console.log("effectiveDuration calculado:", effectiveDuration);

                // 2. Upsert allocation
                console.log("Upsert allocation (timeSlotId:", input.timeSlotId, ", startTime:", input.startTime, ")");
                const allocation = await tx.allocation.upsert({
                    where: {
                        // id: input.allocationId,
                        timeSlotId_startTime: {
                            timeSlotId: input.timeSlotId,
                            startTime: input.startTime
                        }
                    },
                    update: {},
                    create: {
                        timeSlot: { connect: { id: input.timeSlotId } },
                        startTime: input.startTime,
                        endTime: new Date(new Date(input.startTime).getTime() + effectiveDuration * 60000), // Convert minutes to ms
                        status: 'AVAILABLE',
                    }
                });
                console.log("Allocation result:", allocation);

                if (!allocation) {
                    console.error("No se pudo crear u obtener allocation");
                    throw new Error('Allocation not found');
                }

                // 2.1 Check if the allocation is available
                console.log("Verificando estado de allocation:", allocation.status);
                if (allocation.status !== 'AVAILABLE') throw new Error('Allocation is not available');

                // 2.2 Check if there's space available
                console.log("currentReservations:", allocation.currentReservations,
                    "| maxConsumers:", timeSlot.sessionType.maxConsumers);
                if (allocation.currentReservations >= timeSlot.sessionType.maxConsumers) {
                    throw new Error('No slots available');
                }

                // 2.3 Check if the user already has a reservation for this allocation
                console.log("Buscando reserva previa del usuario:", input.forConsumerId,
                    " en allocation:", allocation.id);
                const existingReservation = await tx.reservation.findFirst({
                    where: {
                        allocationId: allocation.id,
                        forConsumerId: input.forConsumerId
                    }
                });
                console.log("existingReservation encontrado:", existingReservation);
                if (existingReservation) throw new Error('User already has a reservation for this allocation');

                // 3. Revisa el bundle usage
                console.log("Antes de llamar a calculateBundleRemainingUses");
                try {
                    const remainingUses = await calculateBundleRemainingUses(tx, input.bundleId);
                    console.log("remainingUses:", remainingUses);
                    if (!remainingUses) throw new Error('Bundle has no remaining uses');
                } catch (err) {
                    console.error("Error dentro de calculateBundleRemainingUses o al obtener remainingUses:", err);
                    throw err; // Para que se detenga la transacción
                }
                console.log("Después de obtener remainingUses");

                // 4. Create the reservation
                console.log("Creando nueva reservation...");
                const newReservation = await tx.reservation.create({
                    data: {
                        allocation: { connect: { id: allocation.id } },
                        bundle: { connect: { id: input.bundleId } },
                        status: input.status || "CONFIRMED",
                        ...(input.forConsumerId ? { forConsumer: { connect: { id: input.forConsumerId } } } : {}),
                        ...(input.onBehalfOfName ? { onBehalfOfName: input.onBehalfOfName } : {})
                    },
                    include: {
                        allocation: true,  // Incluir 'allocation' en la respuesta
                        bundle: true,
                    }
                });
                console.log("newReservation creada:", newReservation);

                // 5. Create a bundle usage event
                console.log("Creando evento de uso de bundle...");
                await handleBundleUsageEvent(tx, input.bundleId, newReservation.id, 'USE', 1);

                // 6. Update the allocation's currentReservations and version
                console.log("Actualizando allocation currentReservations y version...");
                const updatedAllocation = await tx.allocation.update({
                    where: {
                        id: allocation.id,
                        version: allocation.version,
                        currentReservations: { lt: timeSlot.sessionType.maxConsumers }
                    },
                    data: {
                        currentReservations: { increment: 1 },
                        version: { increment: 1 }
                    }
                });
                console.log("updatedAllocation:", updatedAllocation);

                if (!updatedAllocation) throw new Error('Concurrent update detected');

                // 7. Preparar datos para Webhooks
                console.log("Preparando datos para webhooks...");
                const consumerName = input.onBehalfOfName || (input.forConsumerId
                    ? await tx.consumer.findUnique({
                        where: { id: input.forConsumerId },
                        select: { firstName: true, lastName: true }
                    })
                    : { firstName: '', lastName: '' });
                console.log("consumerName:", consumerName);

                const consumerData = input.forConsumerId
                    ? await tx.consumer.findUnique({
                        where: { id: input.forConsumerId },
                        select: { firstName: true, lastName: true, email: true }
                    })
                    : { firstName: '', lastName: '', email: '' };
                console.log("consumerData:", consumerData);

                const email = input.onBehalfOfName || consumerData.email;
                const fullName = consumerName.firstName && consumerName.lastName
                    ? `${consumerName.firstName} ${consumerName.lastName}`
                    : consumerName.firstName || consumerName.lastName || 'Unknown Consumer';

                const professorName = timeSlot.agent.name || 'Unknown Professor';
                const sessionTypeName = timeSlot.sessionType?.name || 'Unknown Session Type';

                // Asume que input.startTime es algo como "2025-01-27T15:00:00Z"
                const fecha = new Date(input.startTime);

                // Formato para la fecha: "EEE, dd/mm/yyyy"
                const sessionStartDate = fecha.toLocaleDateString('es-PE', {
                    weekday: 'short', // muestra el día de la semana en corto (lun, mar, mié, etc.)
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    timeZone: 'America/Lima'
                });
                // Ejemplo de salida: "lun, 27/01/2025"

                // Formato para la hora en 24 horas: "HH:mm"
                const sessionStartTime = fecha.toLocaleTimeString('es-PE', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'America/Lima'
                });
                // Ejemplo de salida: "15:00"

                const webhookPayload = {
                    reservationId: newReservation.id,
                    allocationId: allocation.id,
                    consumerId: input.forConsumerId,
                    bundleId: input.bundleId,
                    status: 'created',
                    timestamp: new Date().toISOString(),
                    consumerName: fullName,
                    professorName,
                    sessionTypeName,
                    sessionStartDate,
                    sessionStartTime,
                    toEmail: email,
                };
                console.log("webhookPayload:", webhookPayload);

                await triggerWebhooks('RESERVATION_CREATED', webhookPayload);

                console.log("==== [createReservation] SUCCESS ====");
                return {
                    ...newReservation,
                    allocation,
                    bundle: newReservation.bundle
                };
            }, {
                timeout: 20000, // 20 seconds
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable
            });

            console.log("Resultado final de createReservation:", result);
            console.log("==== [createReservation] END ====");
            return result;
        },

        updateReservation: async (_, { id, input }) => {
            const updatedReservation = await prisma.reservation.update({
                where: { id },
                data: input,
                include: {
                    bundle: {
                        include: { bundleType: true }
                    },
                    allocation: {
                        include: { timeSlot: { include: { sessionType: true, agent: true } } }
                    },
                    forConsumer: true,
                },
            });

            const validatedReservations = await prisma.reservation.findMany({
                where: {
                    allocationId: updatedReservation.allocationId,
                    status: 'VALIDATED',
                },
                include: {
                    forConsumer: true,
                },
            });

            const attendanceList = validatedReservations.map((reservation) => ({
                consumerId: reservation.forConsumer?.id || null,
                firstName: reservation.forConsumer?.firstName || 'Unknown',
                lastName: reservation.forConsumer?.lastName || '',
                email: reservation.forConsumer?.email || '',
                phoneNumber: reservation.forConsumer?.phoneNumber || '',
                validatedAt: new Date(reservation.updatedAt).toLocaleString('es-PE', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'America/Lima'
                }),
            }));

            const sessionStartTime = new Date(
                updatedReservation.allocation?.startTime || new Date()
            );

            console.log("Hora", sessionStartTime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }));
            console.log("Validated At: ", attendanceList
                .map((item) => item.validatedAt))

            // Construir mensaje formateado
            const formattedMessage = `
    ✅ Check-in
    
    📅 Fecha: ${sessionStartTime.toLocaleDateString('es-PE', {
                weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "America/Lima"
            }).replace(/^./, (str) => str.toUpperCase())}
    
    👨‍🏫 Detalles de Sesión:
    - Profesor: ${updatedReservation.allocation?.timeSlot?.agent?.name || 'Desconocido'}
    - Clase: ${updatedReservation.allocation?.timeSlot?.sessionType?.name || 'Sesión desconocida'}
    - Hora: ${sessionStartTime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: "America/Lima" })}
    
    📝 Asistentes:
    ${attendanceList
                    .map(
                        (item, index) => `
    ${index + 1}. ${item.firstName} ${item.lastName}
       📧 Email: ${item.email}
       📞 Teléfono: ${item.phoneNumber}
       🕒 Validado: ${item.validatedAt}`
                    )
                    .join('\n')}
    `;


            const payload = {
                reservationId: updatedReservation.id,
                status: updatedReservation.status,
                bundle: {
                    id: updatedReservation.bundle.id,
                    type: updatedReservation.bundle.bundleType.name,
                    price: updatedReservation.bundle.bundleType.price,
                },
                consumer: {
                    id: updatedReservation.forConsumer?.id || null,
                    firstName: updatedReservation.forConsumer?.firstName || 'Unknown',
                    lastName: updatedReservation.forConsumer?.lastName || '',
                    email: updatedReservation.forConsumer?.email || '',
                    phoneNumber: updatedReservation.forConsumer?.phoneNumber || '',
                },
                session: {
                    type: updatedReservation.allocation?.timeSlot?.sessionType?.name || 'Unknown Session',
                    professor: updatedReservation.allocation?.timeSlot?.agent?.name || 'Unknown Professor',
                    startDate: sessionStartTime.toLocaleDateString('es-PE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'America/Lima'
                    }),
                    startTime: sessionStartTime.toLocaleTimeString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        timeZone: 'America/Lima'
                    }),
                },
                timestamp: new Date().toISOString(),
                note:
                    input.status === 'CANCELLED'
                        ? 'Reserva cancelada por el usuario.'
                        : 'Check-in realizado exitosamente.',
                message: formattedMessage, // Incluir el mensaje formateado aquí
            };

            // If the reservation is cancelled, create a REFUND event
            if (input.status === 'CANCELLED') {
                await handleBundleUsageEvent(updatedReservation.bundle.id, id, 'REFUND', 1);
                await triggerWebhooks('RESERVATION_CANCELLED', payload);
            }

            // If the reservation is validated, you might want to trigger some event or log
            if (input.status === 'VALIDATED') {
                console.log(`Reservation has been validated.`);
                // Add any additional logic here if needed
                await triggerWebhooks('RESERVATION_VALIDATED', payload);
            }

            return updatedReservation;
        },
        deleteReservation: async (_, { id }) => {
            try {
                // Busca la reserva para obtener su allocationId
                const reservation = await prisma.reservation.findUnique({
                    where: { id },
                    select: { allocationId: true },
                });

                if (!reservation) {
                    throw new Error("Reservation not found");
                }

                // Actualiza el allocation restando 1 a currentReservations
                await prisma.allocation.update({
                    where: { id: reservation.allocationId },
                    data: {
                        currentReservations: {
                            decrement: 1, // Resta 1 al campo currentReservations
                        },
                    },
                });

                // Elimina la reserva
                const deletedReservation = await prisma.reservation.delete({
                    where: { id },
                });

                return deletedReservation;
            } catch (error) {
                console.error("Error deleting reservation:", error);
                throw new Error("Failed to delete reservation");
            }
        },
        createGroupReservation: async (_, { input }) => {
            try {
                const result = await prisma.$transaction(async (tx) => {
                    // 1. Get the current allocation and its associated session type
                    const allocation = await tx.allocation.findUnique({
                        where: { id: input.allocationId },
                        include: {
                            timeSlot: {
                                include: { sessionType: true }
                            }
                        }
                    })

                    if (!allocation) throw new Error('Allocation not found')

                    // 2. Check if the allocation is available
                    if (allocation.status !== 'AVAILABLE') throw new Error('Allocation is not available')

                    // 3. Calculate the group size
                    const groupSize = input.participants.length

                    // 3. Check if there's space available for the group
                    if (allocation.currentReservations + groupSize > allocation.timeSlot.sessionType.maxConsumers) throw new Error('Not enough slots available for the group')

                    // 4. Create the group reservation
                    const groupReservation = await tx.groupReservation.create({
                        data: {
                            name: input.groupName,
                            allocation: { connect: { id: input.allocationId } },
                            ...(input.bundleId ? { bundle: { connect: { id: input.bundleId } } } : {}),
                        }
                    })

                    // 5. Create individual reservations for each participant
                    for (const participant of input.participants) {
                        await tx.reservation.create({
                            data: {
                                allocation: { connect: { id: input.allocationId } },
                                groupReservation: { connect: { id: groupReservation.id } },
                                ...(input.bundleId ? { bundle: { connect: { id: input.bundleId } } } : {}),
                                ...(participant.forConsumerId ? { forConsumer: { connect: { id: participant.forConsumerId } } } : {}),
                                ...(participant.onBehalfOfName ? { onBehalfOfName: participant.onBehalfOfName } : {})
                            }
                        })
                    }

                    // 6. Update the allocation's currentReservations and version
                    const updatedAllocation = await tx.allocation.update({
                        where: {
                            id: input.allocationId,
                            version: allocation.version,
                            currentReservations: { lte: allocation.timeSlot.sessionType.maxConsumers - groupSize }
                        },
                        data: {
                            currentReservations: { increment: groupSize },
                            version: { increment: 1 }
                        }
                    })

                    if (!updatedAllocation) throw new Error('Concurrent update detected')

                    return true
                }, {
                    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
                })

                return result
            } catch (error) {
                console.error('Group reservation failed:', error)
                return false
            }
        },
        updateGroupReservation: (_, { id, input }) => prisma.groupReservation.update({ where: { id }, data: input }),

        createWebhook: async (_, { input }, context) => {
            // Ensure the user is authenticated
            if (!context.user) {
                throw new Error('You must be logged in to create a webhook');
            }

            const { event, url } = input;

            // Create the webhook
            const webhook = await prisma.webhook.create({
                data: {
                    event,
                    url
                },
            });

            return webhook;
        },

        createPaymentLink: async (_, { input }) => {
            const { name, description, amount, validFrom, expiresAt } = input;
            const url = `${process.env.PAYMENT_BASE_URL}/${uuidv4()}`;

            return prisma.paymentLink.create({
                data: {
                    name,
                    description,
                    amount,
                    url,
                    validFrom,
                    expiresAt,
                    status: 'ACTIVE',
                },
            });
        },
        updatePaymentLink: async (_, { id, input }) => {
            return prisma.paymentLink.update({
                where: { id },
                data: input,
            });
        },
        updatePaymentLinkStatus: async (_, { id, status }) => {
            return prisma.paymentLink.update({
                where: { id },
                data: { status },
            });
        },
        deletePaymentLink: async (_, { id }) => {
            await prisma.paymentLink.delete({ where: { id } });
            return true;
        },

        // async createApiKey(_, { tier, name }, context) {
        //     // Check if user is authorized to create keys
        //     // if (!context.user?.isAdmin) {
        //     //     throw new GraphQLError('Unauthorized');
        //     // }

        //     return await apiKeyManager.generateApiKey(
        //         context?.user?.id || 'undefined',
        //         tier,
        //         name
        //     );
        // },

        // async disableApiKey(_, { key }, context) {
        //     // Check if user owns this key
        //     const keyData = await apiKeyManager.validateApiKey(key);
        //     if (keyData?.ownerId !== context.user?.id) {
        //         throw new GraphQLError('Unauthorized');
        //     }

        //     return await apiKeyManager.disableApiKey(key);
        // }
    },

    Agency: {
        contexts: (parent) => prisma.context.findMany({ where: { agencyId: parent.id } }),
        agentSessionTypeAgencies: (parent) => prisma.agentSessionTypeAgency.findMany({ where: { agencyId: parent.id } }),
    },

    Agent: {
        timeSlots: (parent) => prisma.timeSlot.findMany({ where: { agentId: parent.id } }),
        agentSessionTypeAgencies: (parent) => prisma.agentSessionTypeAgency.findMany({ where: { agentId: parent.id } }),
        sessions: (parent) => prisma.session.findMany({ where: { agentId: parent.id } }),
        altSessionAgents: (parent) => prisma.altSessionAgent.findMany({ where: { agentId: parent.id } }),
    },

    Context: {
        agency: (parent) => prisma.agency.findUnique({ where: { id: parent.agencyId } }),
        parentContext: (parent) => parent.parentContextId ? prisma.context.findUnique({ where: { id: parent.parentContextId } }) : null,
        children: (parent) => prisma.context.findMany({ where: { parentContextId: parent.id } }),
        timeSlots: (parent) => prisma.timeSlot.findMany({ where: { contextId: parent.id } }),
    },

    TimeSlot: {
        agent: (parent) => {
            if (!parent.agentId) {
                return null;
            }
            return prisma.agent.findUnique({ where: { id: parent.agentId } });
        },
        context: (parent) => prisma.context.findUnique({ where: { id: parent.contextId } }),
        sessionType: (parent) => prisma.sessionType.findUnique({ where: { id: parent.sessionTypeId } }),
        allocations: (parent) => prisma.allocation.findMany({ where: { timeSlotId: parent.id } }),
        duration: async (parent) => {
            if (parent.duration !== null && parent.duration !== undefined) {
                return parent.duration;
            }
            const sessionType = await prisma.sessionType.findUnique({ where: { id: parent.sessionTypeId } });
            return sessionType ? sessionType.defaultDuration : null;
        },
    },

    Allocation: {
        sessionType: (parent) => prisma.sessionType.findUnique({ where: { id: parent.sessionTypeId } }),
        timeSlot: (parent) => prisma.timeSlot.findUnique({ where: { id: parent.timeSlotId } }),
        sessions: (parent) => prisma.session.findMany({ where: { allocationId: parent.id } }),
        reservations: (parent) => prisma.reservation.findMany({ where: { allocationId: parent.id } }),
        groupReservations: (parent) => prisma.groupReservation.findMany({ where: { allocationId: parent.id } }),
    },

    SessionType: {
        timeSlots: (parent) => prisma.timeSlot.findMany({ where: { sessionTypeId: parent.id } }),
        agentSessionTypeAgencies: (parent) => prisma.agentSessionTypeAgency.findMany({ where: { sessionTypeId: parent.id } }),
    },

    Session: {
        agent: (parent) => prisma.agent.findUnique({ where: { id: parent.agentId } }),
        allocation: (parent) => prisma.allocation.findUnique({ where: { id: parent.allocationId } }),
        sessionConsumers: (parent) => prisma.sessionConsumer.findMany({ where: { sessionId: parent.id } }),
    },

    Consumer: {
        sessionConsumers: (parent) => prisma.sessionConsumer.findMany({ where: { consumerId: parent.id } }),
        bundles: (parent, { statuses = ['ACTIVE'] }) => prisma.bundle.findMany({
            where: {
                consumerId: parent.id,
                status: { in: statuses }
            }
        }),
        reservations: (parent) => prisma.reservation.findMany({ where: { forConsumerId: parent.id } }),
        tags: (parent) => prisma.tag.findMany({ where: { consumers: { some: { id: parent.id } } } }),
        fullName: (consumer) => `${consumer.firstName} ${consumer.lastName}`,
    },

    Bundle: {
        bundleType: (parent) => prisma.bundleType.findUnique({ where: { id: parent.bundleTypeId } }),
        consumer: (parent) => prisma.consumer.findUnique({ where: { id: parent.consumerId } }),
        parentBundle: (parent) => parent.parentBundleId ? prisma.bundle.findUnique({ where: { id: parent.parentBundleId } }) : null,
        children: (parent) => prisma.bundle.findMany({ where: { parentBundleId: parent.id } }),
        reservations: (parent) => prisma.reservation.findMany({ where: { bundleId: parent.id } }),
        totalUses: async (parent) => {
            const { _sum } = await prisma.bundleItem.aggregate({
                where: { bundleId: parent.id, type: 'SESSION' },
                _sum: { quantity: true },
            });
            return _sum.quantity || 0;
        },
        remainingUses: async (parent) => {
            // 1. Fetch the bundle and its items
            const bundle = await prisma.bundle.findUnique({
                where: { id: parent.id },
                include: {
                    bundleItems: true,
                    bundleUsageEvents: true
                }
            });

            if (!bundle) {
                throw new Error('Bundle not found');
            }

            // 2. Initialize remaining uses
            let remainingSessions = bundle.bundleItems
                .filter((item) => item.type === 'SESSION')
                .reduce((sum, item) => sum + item.quantity, 0);

            // 3. Apply usage events
            for (const event of bundle.bundleUsageEvents) {
                switch (event.type) {
                    case 'USE':
                        remainingSessions -= event.quantity;
                        break;
                    case 'REFUND':
                        remainingSessions += event.quantity;
                        break;
                    case 'EXPIRE':
                    case 'CANCEL':
                        remainingSessions = 0;
                        break;
                }
            }

            // 4. Ensure no negative value
            remainingSessions = Math.max(remainingSessions, 0);

            return remainingSessions;
        },
        bundleUsageEvents: (parent) => prisma.bundleUsageEvent.findMany({ where: { bundleId: parent.id } }),
    },

    BundleUsageEvent: {
        bundle: (parent) => prisma.bundle.findUnique({ where: { id: parent.bundleId } }),
        reservation: (parent) => prisma.reservation.findUnique({ where: { id: parent.reservationId } }),
    },

    Reservation: {
        bundle: (parent) => prisma.bundle.findUnique({ where: { id: parent.bundleId } }),
        allocation: (parent) => prisma.allocation.findUnique({ where: { id: parent.allocationId } }),
        forConsumer: (parent) => parent.forConsumerId ? prisma.consumer.findUnique({ where: { id: parent.forConsumerId } }) : null,
        groupReservation: (parent) => parent.groupReservationId ? prisma.groupReservation.findUnique({ where: { id: parent.groupReservationId } }) : null,
        bundleUsageEvents: (parent) => prisma.bundleUsageEvent.findMany({ where: { reservationId: parent.id } }),
    },

    GroupReservation: {
        allocation: (parent) => prisma.allocation.findUnique({ where: { id: parent.allocationId } }),
        reservations: (parent) => prisma.reservation.findMany({ where: { groupReservationId: parent.id } }),
    },

    PaymentLink: {
        status: async (parent) => {
            if (parent.status === 'ACTIVE') {
                const now = new Date();
                if (parent.expiresAt && parent.expiresAt < now) {
                    // If the link has expired, update the status in the database
                    await prisma.paymentLink.update({
                        where: { id: parent.id },
                        data: { status: 'EXPIRED' },
                    });
                    return 'EXPIRED';
                }
            }
            return parent.status;
        },
    },

    DateTime: DateTimeResolver,
}

export default resolvers