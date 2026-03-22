/**
 * HotspotTracker - 热点追踪器组件
 *
 * 负责计算和更新热点资讯的状态
 */

import React, { useEffect, useRef } from 'react';
import { newsService } from '@/services/news.service';

interface HotspotTrackerProps {
  onHotspotsUpdate: (hotItems: Array<{id: string; hotScore: number}>) => void;
  children: React.ReactNode;
}

const HotspotTracker: React.FC<HotspotTrackerProps> = ({
  onHotspotsUpdate,
  children
}) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 更新热点数据
  const updateHotspots = async () => {
    try {
      const response = await newsService.getHotNews(10);
      if (response.success && response.data) {
        const hotData = response.data.map(item => ({
          id: item.id,
          hotScore: item.hotScore
        }));
        onHotspotsUpdate(hotData);
      }
    } catch (error) {
      console.error('更新热点数据失败:', error);
    }
  };

  // 初始化和定期更新
  useEffect(() => {
    // 立即更新一次
    updateHotspots();

    // 设置定时更新
    const config = newsService.getConfig();
    intervalRef.current = setInterval(updateHotspots, config.updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return <>{children}</>;
};

export default HotspotTracker;