import { useState, useEffect } from 'react';
import apiClient from '../api/client';

export const useEvents = (options = {}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/events', {
          params: { skip: 0, take: 10, ...options },
        });
        setEvents(response.data || []);
      } catch (err) {
        setError(err.message);
        setEvents([
          {
            id: '1',
            month: 'JUN',
            day: '5',
            dayWeek: 'THU',
            type: 'OFFICE HOURS',
            title: 'Project Finance Deep Dive: Structuring Your First Deal',
            meta: '3:00 PM GMT · Kwame Asante · 14 spots left',
            rsvped: false,
            typeColor: '#1D4ED8',
            typeBg: '#EFF6FF',
          },
          {
            id: '2',
            month: 'JUN',
            day: '10',
            dayWeek: 'TUE',
            type: 'WORKSHOP',
            title: 'Building a 1MW Financial Model from Scratch',
            meta: '2:00 PM GMT · Ngozi Fakoya · 2h session',
            rsvped: true,
            typeColor: '#059669',
            typeBg: '#ECFDF5',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
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
