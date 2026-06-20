import { render, screen } from '@testing-library/react';
import ItineraryView from './components/ItineraryView';

// ─── ItineraryView integration tests ─────────────────────
describe('ItineraryView (App-level)', () => {
  test('renders itinerary header', () => {
    render(<ItineraryView itinerary={[{ day: 1, plan: 'Arrival' }]} />);
    expect(screen.getByText(/Itinerary/i)).toBeInTheDocument();
  });

  test('last day has departure class', () => {
    const items = [
      { day: 1, plan: 'Arrival' },
      { day: 2, plan: 'Sightseeing' },
      { day: 3, plan: 'Departure & Check-out' },
    ];
    render(<ItineraryView itinerary={items} />);
    const days = document.querySelectorAll('.itinerary-day');
    expect(days).toHaveLength(3);
    expect(days[2]).toHaveClass('itinerary-day-last');
  });

  test('renders nothing for empty array', () => {
    const { container } = render(<ItineraryView itinerary={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('day number is shown for each row', () => {
    const items = [{ day: 1, plan: 'A' }, { day: 2, plan: 'B' }];
    render(<ItineraryView itinerary={items} />);
    expect(screen.getByText('Day 1')).toBeInTheDocument();
    expect(screen.getByText('Day 2')).toBeInTheDocument();
  });
});
