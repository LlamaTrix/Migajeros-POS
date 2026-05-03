import { useState, useEffect } from 'react';

export default function Clock({ timeClass, dateClass }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const ms = 1000 - new Date().getMilliseconds();
    const initial = setTimeout(() => {
      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }, ms);
    return () => clearTimeout(initial);
  }, []);

  return (
    <>
      <div className={timeClass}>{now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</div>
      <div className={dateClass}>{now.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
    </>
  );
}
