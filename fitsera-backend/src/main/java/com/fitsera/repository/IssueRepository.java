package com.fitsera.repository;

import com.fitsera.model.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IssueRepository extends JpaRepository<Issue, UUID> {
    List<Issue> findByAccountId(UUID accountId);
    List<Issue> findByStatus(String status);
    List<Issue> findByAccountIdAndStatus(UUID accountId, String status);
    List<Issue> findByPriority(String priority);
}

