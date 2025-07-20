'use client';

import { useState, useEffect } from 'react';
import { FoodRecordList } from '@/components/food/food-record-list';
import { FoodRecordService } from '@/lib/database';
import { FoodRecord } from '@/types/database';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { Calendar } from '@/components/ui/calendar';

export default function HistoryPage() {
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const foodRecordService = new FoodRecordService();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      loadRecordsForDate(selectedDate);
    }
  }, [selectedDate, user, refreshTrigger]);

  const loadRecordsForDate = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);
      const dateString = date.toISOString().split('T')[0];
      const dayRecords = await foodRecordService.getFoodRecordsByDate(dateString);
      setRecords(dayRecords);
    } catch (err) {
      console.error('Error loading records for date:', err);
      setError('加载记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRecordDeleted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">历史记录</h1>
          <p className="text-gray-600">查看您的饮食历史记录</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 日历选择器 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">选择日期</h2>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </div>

          {/* 选中日期的记录 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{formatDate(selectedDate)}</h2>
                <p className="text-gray-600">当日饮食记录</p>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">加载中...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button 
                    onClick={() => loadRecordsForDate(selectedDate)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    重试
                  </button>
                </div>
              ) : (
                <FoodRecordList 
                  records={records}
                  onRecordUpdated={handleRecordUpdated}
                  onRecordDeleted={handleRecordDeleted}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}