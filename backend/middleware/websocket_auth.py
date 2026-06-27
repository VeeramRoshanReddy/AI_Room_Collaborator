from sqlalchemy.orm import Session
from core.database import get_db
from core.security import verify_token
from models.postgresql.user import User as PGUser

async def get_user_from_token(token: str, db: Session = None):
    """Verify a JWT token and return the user information as a dictionary, or None if invalid."""
    try:
        payload = verify_token(token)
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        close_db = False
        if db is None:
            db = next(get_db())
            close_db = True
        
        try:
            user = db.query(PGUser).filter(PGUser.id == user_id).first()
            if not user or not user.is_active:
                return None
            
            # Return user information as dictionary
            return {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "picture": user.picture
            }
        finally:
            if close_db:
                db.close()
    except Exception as e:
        return None 