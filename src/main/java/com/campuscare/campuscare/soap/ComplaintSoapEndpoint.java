package com.campuscare.campuscare.soap;

import java.io.StringReader;

import javax.xml.transform.Source;
import javax.xml.transform.stream.StreamSource;

import org.springframework.stereotype.Component;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

import com.campuscare.campuscare.repository.ComplaintRepository;

@Endpoint
@Component
public class ComplaintSoapEndpoint {

    private static final String NAMESPACE =
            "http://campuscare.com/soap/complaints";

    private final ComplaintRepository complaintRepository;

    public ComplaintSoapEndpoint(
            ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
    }

    @PayloadRoot(
            namespace = NAMESPACE,
            localPart = "GetComplaintStatisticsRequest")
    @ResponsePayload
    public Source getStatistics(
            @RequestPayload Source request) {

        long total = complaintRepository.count();

        long submitted =
                complaintRepository.countByStatusIgnoreCase("SUBMITTED");

        long assigned =
                complaintRepository.countByStatusIgnoreCase("ASSIGNED");

        long inProgress =
                complaintRepository.countByStatusIgnoreCase("IN_PROGRESS");

        long resolved =
                complaintRepository.countByStatusIgnoreCase("RESOLVED");

        long closed =
                complaintRepository.countByStatusIgnoreCase("CLOSED");

        String xml =
                "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
                + "<GetComplaintStatisticsResponse "
                + "xmlns=\"" + NAMESPACE + "\">"
                + "<totalComplaints>" + total
                + "</totalComplaints>"
                + "<submittedComplaints>" + submitted
                + "</submittedComplaints>"
                + "<assignedComplaints>" + assigned
                + "</assignedComplaints>"
                + "<inProgressComplaints>" + inProgress
                + "</inProgressComplaints>"
                + "<resolvedComplaints>" + resolved
                + "</resolvedComplaints>"
                + "<closedComplaints>" + closed
                + "</closedComplaints>"
                + "</GetComplaintStatisticsResponse>";

        return new StreamSource(new StringReader(xml));
    }
}