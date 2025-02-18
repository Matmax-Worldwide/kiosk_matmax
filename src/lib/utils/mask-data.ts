export const maskEmail = (email: string) => {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (!domain) return email;
  
  const maskedUsername = username.length > 3
    ? `${username.slice(0, 3)}${'*'.repeat(username.length - 3)}`
    : username;
  
  const [domainName, extension] = domain.split('.');
  if (!extension) return `${maskedUsername}@${domain}`;
  
  const maskedDomain = domainName.length > 1
    ? `${domainName[0]}${'*'.repeat(domainName.length - 1)}`
    : domainName;
  
  return `${maskedUsername}@${maskedDomain}.${extension}`;
};

export const maskPhoneNumber = (phone: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const last4 = cleaned.slice(-4);
  return `${'*'.repeat(cleaned.length - 4)}${last4}`;
};