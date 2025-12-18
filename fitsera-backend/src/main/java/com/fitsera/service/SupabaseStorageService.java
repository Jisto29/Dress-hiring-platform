package com.fitsera.service;

import com.fitsera.model.MediaAsset;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service for uploading files to Supabase Storage
 * Uses Supabase Storage REST API
 */
@Service
public class SupabaseStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.storage.bucket}")
    private String bucketName;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * Upload a file to Supabase Storage
     * 
     * @param file The file to upload
     * @param accountId The account ID (for folder organization)
     * @param entityType Type of entity (e.g., "product")
     * @param entityId The entity ID (e.g., product UUID)
     * @return MediaAsset with storage details
     * @throws IOException If upload fails
     */
    public MediaAsset uploadFile(MultipartFile file, UUID accountId, String entityType, UUID entityId) throws IOException, InterruptedException {
        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename != null && originalFilename.contains(".") 
            ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
            : "";
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
        
        // Organize files: accountId/entityType/entityId/filename
        String storagePath = String.format("%s/%s/%s/%s", 
            accountId.toString(), 
            entityType, 
            entityId.toString(), 
            uniqueFilename
        );

        // Upload to Supabase Storage
        String uploadUrl = String.format("%s/storage/v1/object/%s/%s", 
            supabaseUrl, 
            bucketName, 
            storagePath
        );

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(uploadUrl))
            .header("Authorization", "Bearer " + supabaseKey)
            .header("Content-Type", file.getContentType())
            .POST(HttpRequest.BodyPublishers.ofByteArray(file.getBytes()))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200 && response.statusCode() != 201) {
            throw new IOException("Failed to upload file to Supabase: " + response.body());
        }

        // Generate public URL
        String publicUrl = String.format("%s/storage/v1/object/public/%s/%s", 
            supabaseUrl, 
            bucketName, 
            storagePath
        );

        // Create MediaAsset entity
        MediaAsset mediaAsset = new MediaAsset();
        mediaAsset.setId(UUID.randomUUID());
        mediaAsset.setAccountId(accountId);
        mediaAsset.setEntityType(entityType);
        mediaAsset.setEntityId(entityId);
        mediaAsset.setFileName(originalFilename);
        mediaAsset.setMimeType(file.getContentType());
        mediaAsset.setFileSize(file.getSize());
        mediaAsset.setStorageBucket(bucketName);
        mediaAsset.setStoragePath(storagePath);
        mediaAsset.setPublicUrl(publicUrl);
        mediaAsset.setCreatedAt(LocalDateTime.now());
        mediaAsset.setUpdatedAt(LocalDateTime.now());

        return mediaAsset;
    }

    /**
     * Delete a file from Supabase Storage
     * 
     * @param storagePath The path to the file in storage
     * @throws IOException If deletion fails
     */
    public void deleteFile(String storagePath) throws IOException, InterruptedException {
        String deleteUrl = String.format("%s/storage/v1/object/%s/%s", 
            supabaseUrl, 
            bucketName, 
            storagePath
        );

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(deleteUrl))
            .header("Authorization", "Bearer " + supabaseKey)
            .DELETE()
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200 && response.statusCode() != 204) {
            throw new IOException("Failed to delete file from Supabase: " + response.body());
        }
    }

    /**
     * Gets the configured storage bucket name.
     *
     * @return The storage bucket name.
     */
    public String getStorageBucket() {
        return bucketName;
    }
}

