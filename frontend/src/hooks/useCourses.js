import { useState, useEffect } from 'react';
import apiClient from '../api/client';

export const useCourses = (options = {}) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/courses', {
          params: { skip: 0, take: 10, ...options },
        });
        setCourses(response.data || []);
      } catch (err) {
        setError(err.message);
        setCourses([
          {
            id: '1',
            title: 'Understanding Clean Energy Ownership Structures',
            category: 'PROJECT FINANCE — MODULE 4',
            metadata: 'Lesson 6 of 10 · 38 min · Certificate',
            progress: 62,
            action: 'Continue lesson',
          },
          {
            id: '2',
            title: 'Financial Modeling for Solar Projects',
            category: 'PROJECT FINANCE — MODULE 5',
            metadata: 'Lesson 2 of 8 · 45 min · Certificate',
            progress: 3,
            action: 'Continue lesson',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return { courses, loading, error };
};

export const useEnrolledCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEnrolled = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/courses/enrolled');
        setCourses(response.data || []);
      } catch (err) {
        setError(err.message);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolled();
  }, []);

  return { courses, loading, error };
};

export const useCourseProgress = (courseId) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/courses/${courseId}/progress`);
        setProgress(response.data);
      } catch (err) {
        setError(err.message);
        setProgress(null);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchProgress();
    }
  }, [courseId]);

  return { progress, loading, error };
};
