package com.fitsera.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"},
    allowCredentials = "true"
)
public class TestController {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.storage.bucket}")
    private String storageBucket;

    /**
     * Test endpoint to verify Supabase configuration
     */
    @GetMapping("/supabase-config")
    public ResponseEntity<Map<String, Object>> testSupabaseConfig() {
        Map<String, Object> config = new HashMap<>();
        
        config.put("supabaseUrl", supabaseUrl);
        config.put("storageBucket", storageBucket);
        config.put("keyConfigured", supabaseKey != null && !supabaseKey.isEmpty());
        config.put("keyLength", supabaseKey != null ? supabaseKey.length() : 0);
        config.put("keyPrefix", supabaseKey != null && supabaseKey.length() > 20 
            ? supabaseKey.substring(0, 20) + "..." 
            : "NOT SET");
        
        return ResponseEntity.ok(config);
    }
}

