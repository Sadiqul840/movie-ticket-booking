package com.movieapp.controller;

import com.movieapp.model.Theater;
import com.movieapp.service.TheaterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/theaters")
public class TheaterController {

    @Autowired
    private TheaterService theaterService;

    @GetMapping
    public List<Theater> getAllTheaters() { return theaterService.getAllTheaters(); }

    @GetMapping("/{id}")
    public Theater getTheater(@PathVariable Long id) { return theaterService.getTheaterById(id); }

    @PostMapping
    public Theater createTheater(@RequestBody Theater theater) { return theaterService.createTheater(theater); }

    @DeleteMapping("/{id}")
    public void deleteTheater(@PathVariable Long id) { theaterService.deleteTheater(id); }
}
