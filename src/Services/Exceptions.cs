namespace XPEHb.Services;

// 400 Bad Request
public class ValidationException : Exception
{
    public ValidationException(string message) : base(message) { }
}

// 404 Not Found 
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}