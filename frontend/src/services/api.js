const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function sendInterviewRequest(payload) {
  const response = await fetch(`${BASE_URL}/api/interview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.details || 'Interview API request failed');
  }

  return data;
}

export async function fetchCandidates() {
  const res = await import('../../../data/candidates.json');
  return res.default?.candidates || res.candidates || [];
}
