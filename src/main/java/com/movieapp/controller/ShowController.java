package com.movieapp.controller;

import com.movieapp.dto.ShowRequest;
import com.movieapp.model.Show;
import com.movieapp.service.ShowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shows")
public class ShowController {

    @Autowired
    private ShowService showService;

    @GetMapping
    public List<Show> getAllShows() { return showService.getAllShows(); }

    @GetMapping("/movie/{movieId}")
    public List<Show> getShowsByMovie(@PathVariable Long movieId) { return showService.getShowsByMovie(movieId); }

    @GetMapping("/{id}")
    public Show getShow(@PathVariable Long id) { return showService.getShowById(id); }

    @PostMapping
    public Show createShow(@RequestBody ShowRequest request) { return showService.createShow(request); }

    @DeleteMapping("/{id}")
    public void deleteShow(@PathVariable Long id) { showService.deleteShow(id); }
}
