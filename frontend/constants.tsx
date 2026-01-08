
import React from 'react';

export const MONTHLY_FEE = 500000; // 500k VND per month

export const CATEGORIES = [
  'Đóng quỹ',
  'Ăn uống',
  'Văn phòng phẩm',
  'Du lịch',
  'Sự kiện',
  'Khác'
];

export const MONTHS = [
  '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
  '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'
];

export const INITIAL_MEMBERS = [
  { id: '1', name: 'Nguyễn Văn A', avatar: 'https://i.pravatar.cc/150?u=1', joinedDate: '2024-01', contributions: ['2024-01', '2024-02', '2024-03'] },
  { id: '2', name: 'Trần Thị B', avatar: 'https://i.pravatar.cc/150?u=2', joinedDate: '2024-01', contributions: ['2024-01', '2024-02'] },
  { id: '3', name: 'Lê Văn C', avatar: 'https://i.pravatar.cc/150?u=3', joinedDate: '2024-01', contributions: ['2024-01', '2024-03'] },
  { id: '4', name: 'Phạm Minh D', avatar: 'https://i.pravatar.cc/150?u=4', joinedDate: '2024-02', contributions: ['2024-02', '2024-03'] },
];

export const INITIAL_TRANSACTIONS = [
  { id: 't1', type: 'INCOME', amount: 500000, date: '2024-03-01', description: 'Nguyễn Văn A đóng quỹ tháng 3', category: 'Đóng quỹ', personName: 'Nguyễn Văn A' },
  { id: 't2', type: 'EXPENSE', amount: 200000, date: '2024-03-05', description: 'Mua trà sữa team building', category: 'Ăn uống' },
  { id: 't3', type: 'INCOME', amount: 500000, date: '2024-03-10', description: 'Phạm Minh D đóng quỹ tháng 3', category: 'Đóng quỹ', personName: 'Phạm Minh D' },
];
