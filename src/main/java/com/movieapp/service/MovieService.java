package com.movieapp.service;

import com.movieapp.model.Movie;
import com.movieapp.repository.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MovieService {
    @Autowired
    private MovieRepository movieRepository;

    public List<Movie> getAllMovies() { return movieRepository.findAll(); }
    public Movie getMovieById(Long id) { return movieRepository.findById(id).orElseThrow(() -> new RuntimeException("Movie not found")); }
    public Movie createMovie(Movie movie) { return movieRepository.save(movie); }
    public Movie updateMovie(Long id, Movie movie) {
        Movie existing = getMovieById(id);
        existing.setTitle(movie.getTitle());
        existing.setGenre(movie.getGenre());
        existing.setLanguage(movie.getLanguage());
        existing.setDescription(movie.getDescription());
        existing.setDurationMinutes(movie.getDurationMinutes());
        existing.setPosterUrl(movie.getPosterUrl());
        existing.setRating(movie.getRating());
        existing.setReleaseDate(movie.getReleaseDate());
        return movieRepository.save(existing);
    }
    public void deleteMovie(Long id) { movieRepository.deleteById(id); }
    public List<Movie> searchMovies(String title) { return movieRepository.findByTitleContainingIgnoreCase(title); }
}
