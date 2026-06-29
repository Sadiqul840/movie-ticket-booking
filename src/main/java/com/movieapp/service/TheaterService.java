package com.movieapp.service;

import com.movieapp.model.Theater;
import com.movieapp.repository.TheaterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TheaterService {
    @Autowired
    private TheaterRepository theaterRepository;

    public List<Theater> getAllTheaters() { return theaterRepository.findAll(); }
    public Theater getTheaterById(Long id) { return theaterRepository.findById(id).orElseThrow(() -> new RuntimeException("Theater not found")); }
    public Theater createTheater(Theater theater) { return theaterRepository.save(theater); }
    public void deleteTheater(Long id) { theaterRepository.deleteById(id); }
}
