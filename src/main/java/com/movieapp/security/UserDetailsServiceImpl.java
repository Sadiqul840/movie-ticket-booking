package com.movieapp.security;

import com.movieapp.model.User;
import com.movieapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        System.out.println("Searching user = [" + username + "]");

        System.out.println("========= ALL USERS =========");
        userRepository.findAll().forEach(u ->
                System.out.println(
                        "Username=[" + u.getUsername() + "] Email=[" + u.getEmail() + "]"
                )
        );
        System.out.println("=============================");

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found: " + username));

        return UserPrincipal.build(user);
    }
}
