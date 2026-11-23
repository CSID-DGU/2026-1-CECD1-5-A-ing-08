package com.readb.service.talk;

import com.readb.domain.talk.SpeakerProfile;
import com.readb.domain.talk.ClassifiedSpeech;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;

@Slf4j
@Component
public class AudioAnalyzer {

    private final VoiceFeatureAnalyzer featureAnalyzer = new VoiceFeatureAnalyzer();

    public byte[] toPcm(MultipartFile file) throws IOException {
        Path input = Files.createTempFile("talk_", ".webm");
        Path output = Files.createTempFile("talk_", ".raw");
        try {
            file.transferTo(input.toFile());
            ProcessBuilder pb = new ProcessBuilder(
                "ffmpeg", "-y", "-i", input.toString(),
                "-f", "s16le", "-ar", "16000", "-ac", "1",
                output.toString()
            );
            pb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
            pb.redirectError(ProcessBuilder.Redirect.DISCARD);
            Process p = pb.start();
            boolean finished = p.waitFor(60, java.util.concurrent.TimeUnit.SECONDS);
            if (!finished) {
                p.destroyForcibly();
                throw new IOException("FFmpeg timed out after 60 seconds");
            }
            if (p.exitValue() != 0) {
                throw new IOException("FFmpeg failed with exit code " + p.exitValue());
            }
            return Files.readAllBytes(output);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("FFmpeg interrupted", e);
        } finally {
            Files.deleteIfExists(input);
            Files.deleteIfExists(output);
        }
    }

    public SpeakerProfile extractProfile(byte[] pcm) {
        return featureAnalyzer.extractProfile(pcm);
    }

    public ClassifiedSpeech classifyChunk(byte[] pcm, SpeakerProfile leader, SpeakerProfile member) {
        return featureAnalyzer.classifyChunk(pcm, leader, member);
    }
}
