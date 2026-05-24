import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { notificationService } from '../services/notification.service';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export const useNotificationDeepLink = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { markAsRead } = useNotifications();
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const searchParams = new URLSearchParams(location.search);
    const notificationId = searchParams.get('notification_id');
    const redirectPath = searchParams.get('redirect');

    if (!notificationId || processedRef.current.has(notificationId)) return;

    const handleDeepLink = async () => {
      processedRef.current.add(notificationId);

      try {
        // Fetch notification details
        const role = user.role.toLowerCase() as 'student' | 'teacher' | 'admin';
        const notification = await notificationService.getById(role, notificationId);

        if (!notification) {
          toast.error('Không tìm thấy thông báo');
          return;
        }

        // Mark as read
        await markAsRead(notificationId);

        // Navigate based on notification type
        const { type, payload = {} } = notification;
        const { courseId, quizId, lectureId, updateType, topicId, chapterId, certificateId } = payload;

        switch (type) {
          case 'quiz':
          case 'quiz_reminder':
            if (quizId) {
              navigate(`/quiz/${quizId}`);
            } else if (courseId) {
              navigate(`/course/${courseId}/quiz`);
            } else {
              navigate('/my-courses');
            }
            break;

          case 'enrollment':
          case 'enrollment_success':
          case 'enrollment_renewal':
            if (courseId) {
              navigate(`/course/${courseId}/lesson`);
            } else {
              navigate('/my-learning');
            }
            break;

          case 'payment':
            navigate('/orders');
            break;

          case 'review':
          case 'review_reply':
            if (courseId) {
              navigate(`/course/${courseId}?tab=reviews`);
            }
            break;

          case 'course_approved':
          case 'course_rejected':
            if (courseId) {
              navigate(`/teacher/courses/${courseId}`);
            } else {
              navigate('/teacher/courses');
            }
            break;

          case 'forum_reply':
            if (topicId) {
              navigate(`/forum/topic/${topicId}`);
            } else {
              navigate('/forum');
            }
            break;

          case 'certificate':
            if (certificateId && courseId) {
              navigate(`/course/${courseId}/certificate`);
            } else if (courseId) {
              navigate(`/course/${courseId}`);
            } else {
              navigate('/my-courses');
            }
            break;

          case 'course_update':
            if (courseId) {
              if (updateType === 'new_lecture' && lectureId) {
                navigate(`/course/${courseId}/lesson/${lectureId}`);
              } else if (updateType === 'new_chapter' && chapterId) {
                navigate(`/course/${courseId}/lesson`);
              } else {
                navigate(`/course/${courseId}`);
              }
            }
            break;

          case 'chapter_complete':
            if (courseId) {
              navigate(`/course/${courseId}/lesson`);
            }
            break;

          case 'announcement':
            if (courseId) {
              navigate(`/course/${courseId}/announcements`);
            } else {
              navigate('/forum');
            }
            break;

          case 'forum':
          case 'forum_ban':
          case 'forum_reaction':
          case 'report_resolution':
            if (topicId) {
              navigate(`/forum/topic/${topicId}`);
            } else {
              navigate('/forum');
            }
            break;

          case 'study_reminder':
            if (courseId) {
              navigate(`/course/${courseId}/lesson`);
            } else {
              navigate('/my-courses');
            }
            break;

          case 'system':
            // Handle system subtypes like chat_escalation
            if (payload?.type === 'chat_escalation' || payload?.type === 'course_chat_escalation') {
              // Teacher escalation - navigate to teacher chat
              const { courseId, lessonId, escalationId, messageId } = payload;
              if (lessonId) {
                // Lesson chat escalation
                navigate(`/teacher/lecture-chat/${lessonId}?escalationId=${escalationId}&messageId=${messageId}`);
              } else if (courseId) {
                // Course chat escalation
                navigate(`/teacher/chat/${courseId}?escalationId=${escalationId}&messageId=${messageId}`);
              } else {
                // Fallback to chat list
                navigate('/teacher/chats');
              }
            } else if (payload?.type === 'chat_escalation_admin' || payload?.type === 'course_chat_escalation_admin') {
              // Admin escalation - navigate to admin chat
              const { courseId, lessonId, escalationId, messageId } = payload;
              if (lessonId) {
                // Lesson chat escalation
                navigate(`/admin/lecture-chat/${lessonId}?escalationId=${escalationId}&messageId=${messageId}`);
              } else if (courseId) {
                // Course chat escalation
                navigate(`/admin/chat/${courseId}?escalationId=${escalationId}&messageId=${messageId}`);
              } else {
                // Fallback to chat list
                navigate('/admin/chats');
              }
            }
            break;

          default:
            // If redirect path provided, use it
            if (redirectPath) {
              navigate(redirectPath);
            }
            break;
        }

        // Remove query params from URL
        const newSearchParams = new URLSearchParams(location.search);
        newSearchParams.delete('notification_id');
        newSearchParams.delete('redirect');
        const newSearch = newSearchParams.toString();
        navigate(
          { pathname: location.pathname, search: newSearch ? `?${newSearch}` : '' },
          { replace: true }
        );

      } catch (error) {
        console.error('Deep link error:', error);
        toast.error('Không thể mở thông báo');
      }
    };

    handleDeepLink();
  }, [location.search, location.pathname, navigate, user, markAsRead]);
};
