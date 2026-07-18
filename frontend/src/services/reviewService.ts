const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const reviewService = {
  createReview: async (data: any, token: string) => {
    const response = await fetch(`${API_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  updateReview: async (id: string, data: any, token: string) => {
    const response = await fetch(`${API_URL}/api/reviews/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  getBikeReviews: async (bikeId: string) => {
    // Fetches the unified analytics + reviews payload from the backend
    const response = await fetch(`${API_URL}/api/reviews/bike/${bikeId}/analytics`);
    return response.json();
  },

  getMyReviews: async (token: string) => {
    const response = await fetch(`${API_URL}/api/reviews/my`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.json();
  },

  deleteReview: async (id: string, token: string) => {
    const response = await fetch(`${API_URL}/api/reviews/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.json();
  }
};
