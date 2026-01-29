from sqlmodel import Session
from .db import engine, init_db
from .models import User, Center, RegionStat
from .security import hash_password
from sqlalchemy import delete

def run():
    init_db()

    with Session(engine) as session:
        session.exec(delete(RegionStat))
        session.exec(delete(Center))
        session.exec(delete(User))
        session.commit()

        users = [
            User(username="national", password_hash=hash_password("password123"), role="national", region_code=None),
            User(username="metro01",  password_hash=hash_password("password123"), role="metro", region_code="11"),   # 예: 11 서울
            User(username="dist01",   password_hash=hash_password("password123"), role="district", region_code="11010"), # 예: 종로구
            User(username="citizen1", password_hash=hash_password("password123"), role="citizen", region_code=None),
        ]
        session.add_all(users)

        centers = [
            Center(name="서울특별시 광역치매센터", region_code="11", address="서울 어딘가", phone="02-000-0000", level="metro"),
            Center(name="종로구 안심센터", region_code="11010", address="서울 종로구 어딘가", phone="02-111-1111", level="district"),
            Center(name="강남구 안심센터", region_code="11680", address="서울 강남구 어딘가", phone="02-222-2222", level="district"),
        ]
        session.add_all(centers)

        stats = [
            RegionStat(level="sido", region_code="11", centers_count=2, pet_positive_rate=0.18, risk_score_avg=42.0),
            RegionStat(level="sigungu", region_code="11010", centers_count=1, pet_positive_rate=0.22, risk_score_avg=48.0),
            RegionStat(level="sigungu", region_code="11680", centers_count=1, pet_positive_rate=0.15, risk_score_avg=39.0),
        ]
        session.add_all(stats)

        session.commit()
    print("Seeded demo.db with demo users/centers/stats")

if __name__ == "__main__":
    run()
