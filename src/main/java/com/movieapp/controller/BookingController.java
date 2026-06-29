package com.movieapp.controller;

import com.movieapp.dto.BookingRequest;
import com.movieapp.dto.MessageResponse;
import com.movieapp.model.Booking;
import com.movieapp.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.movieapp.security.UserPrincipal;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    public ResponseEntity<?> createBooking(@AuthenticationPrincipal UserPrincipal principal, @RequestBody BookingRequest request) {
        try {
            Booking booking = bookingService.createBooking(principal.getUsername(), request);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/my")
    public List<Booking> myBookings(@AuthenticationPrincipal UserPrincipal principal) {
        return bookingService.getBookingsForUser(principal.getUsername());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelBooking(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        try {
            bookingService.cancelBooking(id, principal.getUsername());
            return ResponseEntity.ok(new MessageResponse("Booking cancelled"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}
