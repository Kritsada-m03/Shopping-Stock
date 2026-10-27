using System.Text.RegularExpressions;
using Shopping.Api.Contracts;

namespace Shopping.Api.Services;

public class MockLoginService
{
    public MockUserResponse Login(MockLoginRequest request)
    {
        var identifier = request.Identifier.Trim();
        if (request.AccountType == "Admin")
        {
            if (identifier != "Admin" || request.Password != "Admin")
                throw new ApiException(401, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");

            return new MockUserResponse("admin", "Admin", "Admin", null);
        }

        if (!Regex.IsMatch(identifier, @"^0[0-9]{9}$"))
            throw new ApiException(400, "กรอกเบอร์โทรไทย 10 หลัก ขึ้นต้นด้วย 0");
        if (request.Password != "1234")
            throw new ApiException(401, "เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง");

        // Accept any correctly formatted example number. No database lookup or OTP.
        return new MockUserResponse($"user-{identifier}", identifier, "User", identifier);
    }
}
