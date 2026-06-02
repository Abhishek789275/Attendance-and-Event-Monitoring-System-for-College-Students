package com.attendance.repository;

import com.attendance.model.Role;
import com.attendance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    List<User> findByRole(Role role);
    List<User> findByRoleAndBranchAndSection(Role role, String branch, String section);
    List<User> findByRoleAndSubject(Role role, String subject);
}
