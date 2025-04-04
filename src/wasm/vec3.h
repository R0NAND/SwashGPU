#pragma once
struct Vec3
{
  float x, y, z;

  void zero();
  Vec3 &operator+=(const Vec3 &other);
  Vec3 operator+(const Vec3 &other) const;
  Vec3 operator-(const Vec3 &other) const;
  Vec3 &operator*=(float scalar);
  Vec3 operator*(float scalar) const;
  Vec3 operator/(float scalar) const;

  float len2();
  float len();
};
