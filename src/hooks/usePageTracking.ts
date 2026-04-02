import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cookieService } from '../services/cookie.service';

export const usePageTracking = () => {
    const location = useLocation();

    useEffect(() => {
        // Log page view when URL changes
        cookieService.logActivity('page_view', location.pathname);
    }, [location.pathname]);

    useEffect(() => {
        // Track time spent on page when user leaves
        const startTime = Date.now();
        
        return () => {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000); // in seconds
            if (timeSpent > 2) { // Only log if they spent more than 2 seconds
                cookieService.logActivity('time_on_page', location.pathname, { seconds: timeSpent });
            }
        };
    }, [location.pathname]);
};
