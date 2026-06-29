package com.movieapp.service;

import com.movieapp.model.Seat;
import com.movieapp.repository.SeatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SeatService {
    @Autowired
    private SeatRepository seatRepository;

    public List<Seat> getSeatsByShow(Long showId) { return seatRepository.findByShowId(showId); }
}
