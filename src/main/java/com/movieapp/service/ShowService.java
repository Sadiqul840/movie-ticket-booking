package com.movieapp.service;

import com.movieapp.dto.ShowRequest;
import com.movieapp.model.Movie;
import com.movieapp.model.Seat;
import com.movieapp.model.Show;
import com.movieapp.model.Theater;
import com.movieapp.repository.MovieRepository;
import com.movieapp.repository.SeatRepository;
import com.movieapp.repository.ShowRepository;
import com.movieapp.repository.TheaterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ShowService {
    @Autowired
    private ShowRepository showRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private TheaterRepository theaterRepository;

    private static final String[] ROWS = {"A","B","C","D","E","F","G","H","I","J"};
    private static final int SEATS_PER_ROW = 6;

    public List<Show> getAllShows() { return showRepository.findAll(); }

    public List<Show> getShowsByMovie(Long movieId) { return showRepository.findByMovieId(movieId); }

    public Show getShowById(Long id) { return showRepository.findById(id).orElseThrow(() -> new RuntimeException("Show not found")); }

    public Show createShow(ShowRequest request) {
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        Theater theater = theaterRepository.findById(request.getTheaterId())
                .orElseThrow(() -> new RuntimeException("Theater not found"));

        Show show = new Show();
        show.setMovie(movie);
        show.setTheater(theater);
        show.setShowTime(request.getShowTime());
        show.setTicketPrice(request.getTicketPrice());
        show.setTotalSeats(request.getTotalSeats() != null ? request.getTotalSeats() : 60);

        Show saved = showRepository.save(show);
        generateSeatsForShow(saved);
        return saved;
    }

    private void generateSeatsForShow(Show show) {
        List<Seat> seats = new ArrayList<>();
        for (String row : ROWS) {
            for (int i = 1; i <= SEATS_PER_ROW; i++) {
                Seat seat = new Seat();
                seat.setShow(show);
                seat.setSeatNumber(row + i);
                seat.setStatus(Seat.SeatStatus.AVAILABLE);
                seats.add(seat);
            }
        }
        seatRepository.saveAll(seats);
    }

    public void deleteShow(Long id) { showRepository.deleteById(id); }
}
