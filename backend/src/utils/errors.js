class HttpError extends Error { constructor(statusCode, message, details){ super(message); this.statusCode=statusCode; this.details=details; } }
class BadRequest extends HttpError { constructor(message='Bad Request', details){ super(400,message,details);} }
class Unauthorized extends HttpError { constructor(message='Unauthorized', details){ super(401,message,details);} }
class Forbidden extends HttpError { constructor(message='Forbidden', details){ super(403,message,details);} }
class NotFound extends HttpError { constructor(message='Not Found', details){ super(404,message,details);} }
class Conflict extends HttpError { constructor(message='Conflict', details){ super(409,message,details);} }
module.exports={HttpError,BadRequest,Unauthorized,Forbidden,NotFound,Conflict};
