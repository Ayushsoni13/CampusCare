# CampusCare — Campus Complaint and Maintenance Management System

CampusCare is a web-based application designed to simplify campus complaint management and maintenance activities. It provides a centralized platform for managing student information, maintenance staff, complaints, assignments, and complaint status history.

The project is developed using Java and Spring Boot, with HTML, CSS, and JavaScript for the frontend and MySQL for database storage. It uses REST APIs for application operations and a SOAP web service for complaint statistics.

## Features

- **Student Management:** Create, retrieve, update, and delete student records.
- **Maintenance Staff Management:** Manage maintenance staff information.
- **Complaint Management:** Register, view, update, and delete complaints.
- **Complaint Assignment:** Assign complaints to maintenance staff.
- **Status Tracking:** Update complaint status and record remarks.
- **Complaint Filtering:** Filter complaints by status and category.
- **Complaint History:** Retrieve the history of complaint status changes.
- **REST API Integration:** Expose application functionality through REST endpoints.
- **SOAP Web Service:** Provide complaint statistics through a SOAP endpoint.
- **Database Integration:** Store application data in MySQL.
- **Web Interface:** Provide a frontend built with HTML, CSS, and JavaScript.

## Technologies Used

| Technology | Purpose |
|---|---|
| Java 25 | Backend programming |
| Spring Boot 4.1.2 | Backend framework |
| Spring Data JPA | Database operations |
| Hibernate | Object-relational mapping |
| MySQL 8 | Relational database |
| HTML5 | Webpage structure |
| CSS3 | Frontend styling |
| JavaScript | Frontend functionality |
| REST APIs | Application communication |
| SOAP Web Services | Complaint statistics service |
| Maven | Build and dependency management |
| Postman | API testing |

## Project Architecture

The application follows a simple client-server architecture.

1. **Frontend:** HTML, CSS, and JavaScript provide the user interface.
2. **Backend:** Spring Boot processes requests and applies application logic.
3. **REST APIs:** Handle student, staff, and complaint management operations.
4. **SOAP Service:** Provides complaint statistics.
5. **Database:** MySQL stores student, staff, complaint, and complaint history records.

```text
User
  |
  v
Frontend (HTML, CSS, JavaScript)
  |
  v
Spring Boot Application
  |
  +------ REST APIs
  |
  +------ SOAP Web Service
  |
  v
MySQL Database
```

## Main API Endpoints

The application runs locally on port `8082` by default.

### Student Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/students` | Retrieve students |
| POST | `/api/students` | Create a student |
| GET | `/api/students/{id}` | Retrieve a student by ID |
| PUT | `/api/students/{id}` | Update a student |
| DELETE | `/api/students/{id}` | Delete a student |

### Maintenance Staff Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/staff` | Retrieve maintenance staff |
| POST | `/api/staff` | Create a staff record |
| GET | `/api/staff/{id}` | Retrieve staff by ID |
| PUT | `/api/staff/{id}` | Update a staff record |
| DELETE | `/api/staff/{id}` | Delete a staff record |

### Complaint Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/complaints` | Retrieve complaints |
| POST | `/api/complaints` | Register a complaint |
| GET | `/api/complaints/{id}` | Retrieve a complaint by ID |
| PUT | `/api/complaints/{id}` | Update a complaint |
| DELETE | `/api/complaints/{id}` | Delete a complaint |
| GET | `/api/complaints/status/{status}` | Filter complaints by status |
| GET | `/api/complaints/category/{category}` | Filter complaints by category |
| PATCH | `/api/complaints/{id}/status` | Update complaint status |
| GET | `/api/complaints/{id}/history` | Retrieve complaint history |

**Additional operation:** Complaints can be assigned to maintenance staff using:

`POST /api/complaints/{id}/assign/{staffId}`

Use the appropriate HTTP methods and request bodies defined by the controllers when testing the APIs.

## SOAP Web Service

The SOAP service provides complaint statistics.

- **SOAP endpoint:** `http://localhost:8082/ws`
