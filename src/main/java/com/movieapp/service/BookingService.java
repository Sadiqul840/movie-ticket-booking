package com.movieapp.service;

import com.movieapp.dto.BookingRequest;
import com.movieapp.model.*;
import com.movieapp.repository.BookingRepository;
import com.movieapp.repository.SeatRepository;
import com.movieapp.repository.ShowRepository;
import com.movieapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private ShowRepository showRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public synchronized Booking createBooking(String username, BookingRequest request) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
        Show show = showRepository.findById(request.getShowId()).orElseThrow(() -> new RuntimeException("Show not found"));

        List<Seat> seats = seatRepository.findAllById(request.getSeatIds());
        if (seats.size() != request.getSeatIds().size()) {
            throw new RuntimeException("One or more seats not found");
        }
        for (Seat seat : seats) {
            if (seat.getStatus() != Seat.SeatStatus.AVAILABLE) {
                throw new RuntimeException("Seat " + seat.getSeatNumber() + " is already booked");
            }
        }
        for (Seat seat : seats) {
            seat.setStatus(Seat.SeatStatus.BOOKED);
        }
        seatRepository.saveAll(seats);

        double total = seats.size() * show.getTicketPrice();

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setShow(show);
        booking.setSeats(seats);
        booking.setTotalAmount(total);
        booking.setStatus(Booking.BookingStatus.CONFIRMED);

        return bookingRepository.save(booking);
    }

    public List<Booking> getBookingsForUser(String username) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
        return bookingRepository.findByUserId(user.getId());
    }

    @Transactional
    public void cancelBooking(Long bookingId, String username) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!booking.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Not authorized to cancel this booking");
        }
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        for (Seat seat : booking.getSeats()) {
            seat.setStatus(Seat.SeatStatus.AVAILABLE);
        }
        seatRepository.saveAll(booking.getSeats());
        bookingRepository.save(booking);
    }
}
