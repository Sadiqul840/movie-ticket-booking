package com.movieapp.config;

import com.movieapp.model.*;
import com.movieapp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired private UserRepository userRepository;
    @Autowired private MovieRepository movieRepository;
    @Autowired private TheaterRepository theaterRepository;
    @Autowired private ShowRepository showRepository;
    @Autowired private SeatRepository seatRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private static final String[] ROWS = {"A","B","C","D","E","F","G","H","I","J"};

    @Override
    public void run(String... args) {
        // Admin user
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@moviebook.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(User.Role.ADMIN);
            userRepository.save(admin);
        }

        if (movieRepository.count() == 0) {
            Movie m1 = new Movie(null, "Inception Reborn", "Sci-Fi", "English",
                    "A thief who steals secrets by infiltrating dreams faces his greatest challenge yet.",
                    148, "https://picsum.photos/seed/movie1/300/450", 8.7, "2026-01-15");
            Movie m2 = new Movie(null, "The Last Horizon", "Action", "English",
                    "An elite team races against time to stop a global catastrophe.",
                    132, "https://picsum.photos/seed/movie2/300/450", 7.9, "2026-02-20");
            Movie m3 = new Movie(null, "Midnight Symphony", "Drama", "Hindi",
                    "A musician's journey through love, loss and redemption.",
                    140, "https://picsum.photos/seed/movie3/300/450", 8.2, "2026-03-05");
            Movie m4 = new Movie(null, "Galaxy Quest Returns", "Comedy", "English",
                    "A hilarious space adventure that pokes fun at sci-fi tropes.",
                    115, "https://picsum.photos/seed/movie4/300/450", 7.4, "2026-01-30");
            Movie m5 = new Movie(null, "Shadow Hunter", "Thriller", "English",
                    "A detective hunts a serial killer who is always one step ahead.",
                    128, "https://picsum.photos/seed/movie5/300/450", 8.0, "2026-02-10");
            Movie m6 = new Movie(null, "Laughter Unlimited", "Comedy", "Telugu",
                    "A feel-good family entertainer full of laughs and heart.",
                    125, "https://picsum.photos/seed/movie6/300/450", 7.6, "2026-03-12");
            movieRepository.saveAll(List.of(m1, m2, m3, m4, m5, m6));
        }

        if (theaterRepository.count() == 0) {
            Theater t1 = new Theater(null, "PVR Cinemas", "Hyderabad", "Banjara Hills, Hyderabad", 60);
            Theater t2 = new Theater(null, "INOX Movies", "Bengaluru", "MG Road, Bengaluru", 60);
            Theater t3 = new Theater(null, "Cinepolis", "Mumbai", "Andheri, Mumbai", 60);
            theaterRepository.saveAll(List.of(t1, t2, t3));
        }

        if (showRepository.count() == 0) {
            List<Movie> movies = movieRepository.findAll();
            List<Theater> theaters = theaterRepository.findAll();
            List<Show> shows = new ArrayList<>();
            LocalDateTime baseTime = LocalDateTime.now().plusHours(2);
            int[] hourSlots = {0, 3, 6, 9}; // offsets to simulate 10am,1pm,4pm,7pm style slots
            for (Movie movie : movies) {
                for (Theater theater : theaters) {
                    for (int offset : hourSlots) {
                        Show show = new Show();
                        show.setMovie(movie);
                        show.setTheater(theater);
                        show.setShowTime(baseTime.plusHours(offset));
                        show.setTicketPrice(150.0 + (offset * 10));
                        show.setTotalSeats(60);
                        shows.add(show);
                    }
                }
            }
            List<Show> savedShows = showRepository.saveAll(shows);

            List<Seat> allSeats = new ArrayList<>();
            for (Show show : savedShows) {
                for (String row : ROWS) {
                    for (int i = 1; i <= 6; i++) {
                        Seat seat = new Seat();
                        seat.setShow(show);
                        seat.setSeatNumber(row + i);
                        seat.setStatus(Seat.SeatStatus.AVAILABLE);
                        allSeats.add(seat);
                    }
                }
            }
            seatRepository.saveAll(allSeats);
        }
    }
}
