import { useEffect, useState } from "react";
import API from "../services/api";

export default function TripPage() {

  const [trips, setTrips] = useState([]);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    const res = await API.get("/trips/all");
    setTrips(res.data);
  };

  return (
    <div>
      <h2>Available Trips</h2>

      {trips.map((t, i) => (
        <div key={i}>
          <p>{t.name}</p>
          <p>₹{t.price}</p>
        </div>
      ))}
    </div>
  );
}