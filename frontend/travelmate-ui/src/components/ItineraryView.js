export default function ItineraryView({ itinerary }) {
  if (!itinerary || itinerary.length === 0) return null;
  return (
    <div className="itinerary-list">
      <div className="itinerary-header">📋 Day-by-Day Itinerary</div>
      {itinerary.map((item, i) => {
        const day  = item.day  || (i + 1);
        const plan = item.plan || item;
        const isLast = i === itinerary.length - 1;
        return (
          <div key={i} className={`itinerary-day ${isLast ? "itinerary-day-last" : ""}`}>
            <div className="itinerary-day-num">Day {day}</div>
            <div className="itinerary-day-plan">{plan}</div>
          </div>
        );
      })}
    </div>
  );
}
