#include "vec3.h"

void Vec3::zero()
{
  x = 0;
  y = 0;
  z = 0;
}

Vec3 &Vec3::operator+=(const Vec3 &other)
{
  x += other.x;
  y += other.y;
  z += other.z;
  return *this;
}

Vec3 Vec3::operator+(const Vec3 &other) const
{
  return Vec3{x + other.x, y + other.y, z + other.z};
}

Vec3 Vec3::operator-(const Vec3 &other) const
{
  return Vec3{x - other.x, y - other.y, z - other.z};
}

Vec3 &Vec3::operator*=(float scalar)
{
  x *= scalar;
  y *= scalar;
  z *= scalar;
  return *this;
}

Vec3 Vec3::operator*(float scalar) const
{
  return Vec3{x * scalar, y * scalar, z * scalar};
}

Vec3 Vec3::operator/(float scalar) const
{
  return Vec3{x / scalar, y / scalar, z / scalar};
}