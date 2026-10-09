const axios = require('axios');

const GRAPH_API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Fetch full lead details from Meta's Graph API using the lead ID.
 *
 * Meta's webhook only sends the lead ID — we need to call the API
 * separately to get the actual field values (name, email, phone, etc.).
 */
async function fetchLeadDetails(leadId) {
  const url = `${BASE_URL}/${leadId}`;

  const response = await axios.get(url, {
    params: {
      access_token: process.env.META_PAGE_ACCESS_TOKEN,
    },
  });

  return response.data;
}

/**
 * Take the raw field_data array from Meta's API response and
 * turn it into a flat object we can store in the DB.
 *
 * Meta returns something like:
 *   [{ name: "full_name", values: ["John Doe"] }, ...]
 *
 * We convert it to:
 *   { full_name: "John Doe", ... }
 */
function parseLeadFields(fieldData) {
  const parsed = {
    name: '',
    email: '',
    phone: '',
    raw: {},
  };

  if (!Array.isArray(fieldData)) return parsed;

  for (const field of fieldData) {
    const key = field.name;
    const value = field.values?.[0] || '';

    parsed.raw[key] = value;

    // Map common Meta field names to our schema
    if (key === 'full_name' || key === 'name') {
      parsed.name = value;
    } else if (key === 'email') {
      parsed.email = value;
    } else if (key === 'phone_number' || key === 'phone') {
      parsed.phone = value;
    }
  }

  return parsed;
}

module.exports = { fetchLeadDetails, parseLeadFields };
