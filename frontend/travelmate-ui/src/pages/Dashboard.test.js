import { render, screen, fireEvent } from '@testing-library/react';
import PackageCard from '../components/PackageCard';
import CancellationPolicyModal from '../components/CancellationPolicyModal';
import ItineraryView from '../components/ItineraryView';

jest.mock('../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
  put: jest.fn(),
}));

// ─── PackageCard ──────────────────────────────────────────
describe('PackageCard', () => {
  const basePkg = {
    id: 1,
    name: 'Goa Bliss',
    duration: 5,
    price: 15000,
    totalSlots: 15,
    bookedSlots: 3,
    type: 'DEFAULT',
    destinationType: 'NATIONAL',
  };

  test('renders package name', () => {
    render(<PackageCard pkg={basePkg} onBook={() => {}} />);
    expect(screen.getByText('Goa Bliss')).toBeInTheDocument();
  });

  test('displays available slots chip', () => {
    render(<PackageCard pkg={basePkg} onBook={() => {}} />);
    expect(screen.getByText('🟢 12 of 15 slots')).toBeInTheDocument();
  });

  test('displays price formatted in INR', () => {
    render(<PackageCard pkg={basePkg} onBook={() => {}} />);
    expect(screen.getByText(/₹15,000/)).toBeInTheDocument();
  });

  test('shows Sold Out when all slots booked', () => {
    render(<PackageCard pkg={{ ...basePkg, bookedSlots: 15 }} onBook={() => {}} />);
    expect(screen.getByText(/Sold Out/i)).toBeInTheDocument();
  });

  test('Book Now button not rendered when sold out', () => {
    render(<PackageCard pkg={{ ...basePkg, bookedSlots: 15 }} onBook={() => {}} />);
    expect(screen.queryByText(/Book Now/i)).not.toBeInTheDocument();
  });

  test('calls onBook with package when Book Now clicked', () => {
    const onBook = jest.fn();
    render(<PackageCard pkg={basePkg} onBook={onBook} />);
    fireEvent.click(screen.getByText(/Book Now/i));
    expect(onBook).toHaveBeenCalledWith(basePkg);
  });

  test('shows Official Package badge for default packages', () => {
    render(<PackageCard pkg={basePkg} onBook={() => {}} />);
    expect(screen.getByText('✅ Official Package')).toBeInTheDocument();
  });
});

// ─── CancellationPolicyModal ─────────────────────────────
describe('CancellationPolicyModal', () => {
  test('renders all three policy sections', () => {
    render(<CancellationPolicyModal onClose={() => {}} onConfirm={() => {}} />);
    expect(screen.getAllByText(/70% Refund/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Advance.*No Refund/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Trip Ongoing.*No Refund/i)[0]).toBeInTheDocument();
  });

  test('calls onConfirm when Proceed button clicked', () => {
    const onConfirm = jest.fn();
    render(<CancellationPolicyModal onClose={() => {}} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /Proceed/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when Go Back clicked', () => {
    const onClose = jest.fn();
    render(<CancellationPolicyModal onClose={onClose} onConfirm={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Go Back/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('renders custom actionLabel', () => {
    render(<CancellationPolicyModal onClose={() => {}} onConfirm={() => {}} actionLabel="Confirm Booking" />);
    expect(screen.getByText(/Confirm Booking/i)).toBeInTheDocument();
  });
});

// ─── ItineraryView ─────────────────────────────────────
describe('ItineraryView', () => {
  const itinerary = [
    { day: 1, plan: 'Arrival + Hotel Check-in' },
    { day: 2, plan: 'City Sightseeing' },
    { day: 3, plan: 'Departure & Check-out' },
  ];

  test('renders all day plans', () => {
    render(<ItineraryView itinerary={itinerary} />);
    expect(screen.getByText(/Arrival/i)).toBeInTheDocument();
    expect(screen.getByText(/City Sightseeing/i)).toBeInTheDocument();
    expect(screen.getByText(/Departure/i)).toBeInTheDocument();
  });

  test('last day has itinerary-day-last class', () => {
    render(<ItineraryView itinerary={itinerary} />);
    const days = document.querySelectorAll('.itinerary-day');
    expect(days[days.length - 1]).toHaveClass('itinerary-day-last');
  });

  test('renders nothing when itinerary is empty', () => {
    const { container } = render(<ItineraryView itinerary={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders correct number of day rows', () => {
    render(<ItineraryView itinerary={itinerary} />);
    expect(document.querySelectorAll('.itinerary-day')).toHaveLength(3);
  });

  test('day number is displayed for each item', () => {
    render(<ItineraryView itinerary={itinerary} />);
    expect(screen.getByText('Day 1')).toBeInTheDocument();
    expect(screen.getByText('Day 3')).toBeInTheDocument();
  });
});
