package com.fitsera.service;

import com.fitsera.model.Issue;
import com.fitsera.repository.IssueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class IssueService {

    @Autowired
    private IssueRepository issueRepository;

    public List<Issue> getAllIssues() {
        return issueRepository.findAll();
    }

    public List<Issue> getIssuesByAccountId(UUID accountId) {
        return issueRepository.findByAccountId(accountId);
    }

    public List<Issue> getIssuesByStatus(String status) {
        return issueRepository.findByStatus(status);
    }

    public List<Issue> getIssuesByAccountIdAndStatus(UUID accountId, String status) {
        return issueRepository.findByAccountIdAndStatus(accountId, status);
    }

    public Optional<Issue> getIssueById(UUID id) {
        return issueRepository.findById(id);
    }

    public Issue saveIssue(Issue issue) {
        return issueRepository.save(issue);
    }

    public void deleteIssue(UUID id) {
        issueRepository.deleteById(id);
    }
}

