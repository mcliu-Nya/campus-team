import { useEffect, useState } from 'react';

/** 输入防抖：搜索框停止输入后才触发请求，避免每个字符一次 IO。 */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
