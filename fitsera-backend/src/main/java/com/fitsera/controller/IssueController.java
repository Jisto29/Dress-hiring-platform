package com.fitsera.controller;

import com.fitsera.model.Issue;
import com.fitsera.service.IssueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/issues")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"}, 
    allowCredentials = "true",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class IssueController {

    @Autowired
    private IssueService issueService;

    @GetMapping
    public ResponseEntity<List<Issue>> getAllIssues() {
        return ResponseEntity.ok(issueService.getAllIssues());
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<Issue>> getIssuesByAccountId(@PathVariable UUID accountId) {
        return ResponseEntity.ok(issueService.getIssuesByAccountId(accountId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Issue>> getIssuesByStatus(@PathVariable String status) {
        return ResponseEntity.ok(issueService.getIssuesByStatus(status));
    }

    @GetMapping("/account/{accountId}/status/{status}")
    public ResponseEntity<List<Issue>> getIssuesByAccountIdAndStatus(
            @PathVariable UUID accountId, 
            @PathVariable String status) {
        return ResponseEntity.ok(issueService.getIssuesByAccountIdAndStatus(accountId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Issue> getIssueById(@PathVariable UUID id) {
        return issueService.getIssueById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Issue> createIssue(@RequestBody Issue issue) {
        return ResponseEntity.ok(issueService.saveIssue(issue));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Issue> updateIssue(@PathVariable UUID id, @RequestBody Issue issue) {
        return issueService.getIssueById(id)
                .map(existingIssue -> {
                    issue.setId(id);
                    return ResponseEntity.ok(issueService.saveIssue(issue));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIssue(@PathVariable UUID id) {
        return issueService.getIssueById(id)
                .map(issue -> {
                    issueService.deleteIssue(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

