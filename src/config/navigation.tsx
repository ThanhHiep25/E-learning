import {
    Home,
    Target,
    Layers,
    BookOpen,
    Library,
    Info,
    type LucideIcon
} from 'lucide-react';

export interface SubmenuItem {
    label: string;
    path: string;
    icon?: LucideIcon;
    color?: 'red' | 'blue' | 'amber' | 'purple' | 'emerald';
}

export interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
    hasSubmenu?: boolean;
    submenuItems?: SubmenuItem[];
}

export const navigationConfig: NavItem[] = [
    { label: 'Trang chủ', path: '/', icon: Home },
    {
        label: 'Bứt phá điểm số',
        path: '#',
        icon: Target,
        hasSubmenu: true,
        submenuItems: [
            { label: 'Toán cao cấp', path: '/toancc', icon: Target, color: 'red' },
            { label: 'Triết học Mác-Lênin', path: '/ngv', icon: Target, color: 'blue' },
            { label: 'Tiếng Anh bứt phá', path: '/anh-bp', icon: Target, color: 'amber' },
            { label: 'Kinh tế vi mô', path: '/ktvm', icon: BookOpen, color: 'red' },
            { label: 'Kinh tế vĩ mô', path: '/ktvm', icon: BookOpen, color: 'blue' },
            { label: 'Lịch sử', path: '/ls', icon: BookOpen, color: 'blue' },

        ]
    },
    {
        label: 'Combo bứt phá',
        path: '#',
        icon: Layers,
        hasSubmenu: true,
        submenuItems: [
            { label: 'Combo Lập trình Python', path: '/combo-lap-trinh-python', icon: Layers, color: 'purple' },
            { label: 'Combo Lập trình Java', path: '/combo-lap-trinh-java', icon: Layers, color: 'emerald' },
            { label: 'Combo Lập trình C', path: '/combo-lap-trinh-c', icon: Layers, color: 'blue' },
        ]
    },
    {
        label: 'Luyện thi',
        path: '#',
        icon: BookOpen,
        hasSubmenu: true,
        submenuItems: [
            { label: 'TOEIC 2 kỹ năng', path: '/toeic-2', icon: BookOpen, color: 'red' },
            { label: 'TOEIC 4 kỹ năng', path: '/toeic-4', icon: BookOpen, color: 'blue' },
            { label: 'Tin học văn phòng', path: '/tin-hoc-van-phong', icon: BookOpen, color: 'amber' },
            { label: 'Chứng chỉ ATTT', path: '/chung-chi-attt', icon: BookOpen, color: 'amber' },
        ]
    },
    { label: 'Khóa học', path: '/courses', icon: Library },
    { label: 'Giới thiệu', path: '/about', icon: Info },
];
