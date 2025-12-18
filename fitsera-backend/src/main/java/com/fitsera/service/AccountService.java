package com.fitsera.service;

import com.fitsera.model.Account;
import com.fitsera.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AccountService {

    @Autowired
    private AccountRepository accountRepository;

    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    public Optional<Account> getAccountById(UUID id) {
        return accountRepository.findById(id);
    }

    public Optional<Account> getAccountBySlug(String slug) {
        return accountRepository.findBySlug(slug);
    }

    public Optional<Account> getAccountByName(String name) {
        return accountRepository.findByName(name);
    }

    public Account createAccount(Account account) {
        // Generate slug from name if not provided
        if (account.getSlug() == null || account.getSlug().isEmpty()) {
            account.setSlug(generateSlug(account.getName()));
        }
        return accountRepository.save(account);
    }

    public Account updateAccount(UUID id, Account accountDetails) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found with id: " + id));

        if (accountDetails.getName() != null) {
            account.setName(accountDetails.getName());
        }
        if (accountDetails.getSlug() != null) {
            account.setSlug(accountDetails.getSlug());
        }
        if (accountDetails.getBrandLogo() != null) {
            account.setBrandLogo(accountDetails.getBrandLogo());
        }

        return accountRepository.save(account);
    }

    public void deleteAccount(UUID id) {
        accountRepository.deleteById(id);
    }

    public boolean existsBySlug(String slug) {
        return accountRepository.existsBySlug(slug);
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .trim();
    }
}

