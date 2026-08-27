# Smart App Control and Work Day with God on Windows 11

Windows 11 Smart App Control may block the unsigned Work Day with God installer. This is a security decision by Windows, not an indication that a user should bypass the warning casually.

Users should download only from the official GitHub release, verify the SHA-256 checksum, and distinguish Smart App Control from ordinary Defender SmartScreen. Smart App Control does not provide a normal per-application allow-list exception. The permanent developer-side solution is signing the installer with a certificate trusted by Windows.

If a user chooses to disable Smart App Control after verifying the file, they should understand that protection is reduced and that the ability to re-enable it can depend on their Windows version and configuration.
