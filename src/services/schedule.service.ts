import { apiRequest } from './api';
import type { ScheduleItem } from '../config/schedule-data';

export interface GetScheduleParams {
    month?: number;
    year?: number;
    from?: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD
}

export interface CreateNoteBody {
    title: string;
    startAt: string;
    endAt: string;
    description?: string;
    courseId?: number | string;
    type?: string;
    status?: string;
    zoomLink?: string;
    meetingId?: string;
    passcode?: string;
    platform?: string;
    location?: string;
}

export const scheduleService = {
    // Student Methods
    getSchedule: async (params: GetScheduleParams = {}) => {
        const query = new URLSearchParams();
        if (params.month) query.append('month', params.month.toString());
        if (params.year) query.append('year', params.year.toString());
        if (params.from) query.append('from', params.from);
        if (params.to) query.append('to', params.to);

        const queryString = query.toString();
        const path = `student/schedule${queryString ? `?${queryString}` : ''}`;
        
        const response = await apiRequest<{ schedule: ScheduleItem[] }>(path);
        return response;
    },

    createNote: async (body: CreateNoteBody) => {
        const response = await apiRequest<{ event: ScheduleItem }>('student/schedule/notes', {
            method: 'POST',
            body: JSON.stringify(body)
        });
        return response.event;
    },

    updateNote: async (noteId: string | number, body: Partial<CreateNoteBody>) => {
        const response = await apiRequest<{ event: ScheduleItem }>(`student/schedule/notes/${noteId}`, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
        return response.event;
    },

    deleteNote: async (noteId: string | number) => {
        return await apiRequest<{ success: boolean }>(`student/schedule/notes/${noteId}`, {
            method: 'DELETE'
        });
    },

    // Teacher Methods
    getTeacherSchedule: async (params: GetScheduleParams = {}) => {
        const query = new URLSearchParams();
        if (params.month) query.append('month', params.month.toString());
        if (params.year) query.append('year', params.year.toString());
        if (params.from) query.append('from', params.from);
        if (params.to) query.append('to', params.to);

        const queryString = query.toString();
        const path = `teacher/schedule${queryString ? `?${queryString}` : ''}`;
        
        return await apiRequest<{ schedule: ScheduleItem[] }>(path);
    },

    createTeacherNote: async (body: CreateNoteBody) => {
        const response = await apiRequest<{ event: ScheduleItem }>('teacher/schedule/notes', {
            method: 'POST',
            body: JSON.stringify(body)
        });
        return response.event;
    },

    updateTeacherNote: async (noteId: string | number, body: Partial<CreateNoteBody>) => {
        const response = await apiRequest<{ event: ScheduleItem }>(`teacher/schedule/notes/${noteId}`, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
        return response.event;
    },

    deleteTeacherNote: async (noteId: string | number) => {
        return await apiRequest<{ success: boolean }>(`teacher/schedule/notes/${noteId}`, {
            method: 'DELETE'
        });
    },

    createCourseEvent: async (courseId: number | string, body: CreateNoteBody) => {
        const response = await apiRequest<{ event: ScheduleItem }>(`teacher/courses/${courseId}/schedule-events`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
        return response.event;
    },

    updateCourseEvent: async (eventId: string | number, body: Partial<CreateNoteBody>) => {
        const response = await apiRequest<{ event: ScheduleItem }>(`teacher/schedule-events/${eventId}`, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
        return response.event;
    },

    deleteCourseEvent: async (eventId: string | number) => {
        return await apiRequest<{ success: boolean }>(`teacher/schedule-events/${eventId}`, {
            method: 'DELETE'
        });
    }
};
