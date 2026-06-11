import { useState, useEffect } from 'react';
import { eventsAPI } from '../api/endpoints';

export const useEvents = (options = {}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await eventsAPI.list({
          skip: options.skip || 0,
          take: options.take || 10,
        });
        setEvents(response.data || []);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load events');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [options.skip, options.take]);

  return { events, loading, error };
};

export const useEventDetails = (eventId) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) {
      setEvent(null);
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await eventsAPI.getById(eventId);
        setEvent(response.data || null);
      } catch (err) {
        console.error('Failed to fetch event details:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load event');
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  return { event, loading, error };
};

export const useEventRsvp = (eventId) => {
  const [rsvpStatus, setRsvpStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchRsvpStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await eventsAPI.getRSVPStatus(eventId);
        setRsvpStatus(response.data);
      } catch (err) {
        console.error('Failed to fetch RSVP status:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load RSVP status');
        setRsvpStatus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRsvpStatus();
  }, [eventId]);

  const rsvp = async (guestCount = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventsAPI.rsvp(eventId);
      setRsvpStatus(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to RSVP';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelRsvp = async () => {
    try {
      setLoading(true);
      setError(null);
      await eventsAPI.cancelRSVP(eventId);
      setRsvpStatus(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to cancel RSVP';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { rsvpStatus, loading, error, rsvp, cancelRsvp };
};
  }, []);

  return { events, loading, error };
};

export const useUpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/events/upcoming');
        setEvents(response.data || []);
      } catch (err) {
        setError(err.message);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcoming();
  }, []);

  return { events, loading, error };
};

export const useEventRSVP = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const rsvp = async (eventId) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/events/${eventId}/rsvp`);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelRsvp = async (eventId) => {
    try {
      setLoading(true);
      const response = await apiClient.delete(`/events/${eventId}/rsvp`);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { rsvp, cancelRsvp, loading, error };
};
