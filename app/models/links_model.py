# app/models/links_model.py
from app import db

class Links(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    img_src = db.Column(db.String(255), nullable=False)
    position = db.Column(db.Integer, nullable=False, default=0)

    def __repr__(self):
        return f'<Link {self.name}>'

    @staticmethod
    def initialize_positions():
        links = Links.query.order_by(Links.id).all()
        for index, link in enumerate(links):
            link.position = index
        db.session.commit()

    def to_dict(self):
        return {
            'id': self.id,
            'url': self.url,
            'name': self.name,
            'img_src': self.img_src,
            'position': self.position,
            # Agrega otros atributos según necesites
        }