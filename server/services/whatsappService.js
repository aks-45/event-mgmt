const WHATSAPP_API_KEY = String(process.env.WHATSAPP_API_KEY || '').trim();
const WHATSAPP_SENDER = String(process.env.WHATSAPP_SENDER || '').trim();
const WHATSAPP_SEND_MESSAGE_URL = 'https://whats-api.rcsoft.in/send-message';
const WHATSAPP_REQUEST_TIMEOUT_MS = Math.max(
  Number(process.env.WHATSAPP_REQUEST_TIMEOUT_MS || 15000),
  5000
);

// Validate required config on startup
if (!WHATSAPP_API_KEY || !WHATSAPP_SENDER) {
  console.warn('⚠️  WhatsApp configuration incomplete: WHATSAPP_API_KEY and WHATSAPP_SENDER must be set in environment variables');
}

const parseProviderResponse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const sendWhatsAppMessage = async ({ number, message, footer = 'IIA' }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WHATSAPP_REQUEST_TIMEOUT_MS);

  const params = new URLSearchParams({
    api_key: WHATSAPP_API_KEY,
    sender: WHATSAPP_SENDER,
    number,
    message,
    footer,
  });

  try {
    const res = await fetch(`${WHATSAPP_SEND_MESSAGE_URL}?${params.toString()}`, {
      method: 'GET',
      signal: controller.signal,
    });
    const text = await res.text();
    const data = parseProviderResponse(text);

    if (!res.ok) {
      throw new Error(`WhatsApp API failed with ${res.status}: ${text}`);
    }

    if (data && typeof data === 'object' && (data.status === false || data.success === false)) {
      throw new Error(`WhatsApp API rejected message: ${data.msg || data.message || text}`);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
};
