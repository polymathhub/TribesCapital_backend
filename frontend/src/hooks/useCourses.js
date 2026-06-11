import { useState, useEffect } from 'react';
import { coursesAPI } from '../api/endpoints';

export const useCourses = (options = {}) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await coursesAPI.list({
          skip: options.skip || 0,
          take: options.take || 100,
        });
        setCourses(response.data || []);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load courses');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [options.skip, options.take]);

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
        setError(null);
        const response = await coursesAPI.getEnrolled();
        setCourses(response.data || []);
      } catch (err) {
        console.error('Failed to fetch enrolled courses:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load enrolled courses');
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
    if (!courseId) {
      setProgress(null);
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await coursesAPI.getProgress(courseId);
        setProgress(response.data || null);
      } catch (err) {
        console.error('Failed to fetch course progress:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load progress');
        setProgress(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [courseId]);

  return { progress, loading, error };
};
