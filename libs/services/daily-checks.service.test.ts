describe("daily-checks.service", () => {});
import { insertDailyCheck } from "./daily-checks.service";

// TODO: implement skipped tests
describe.skip("daily-checks.service", () => {
  describe("insertDailyCheck", () => {
    it.skip("should throw an error if the user has already used all vacations for the month", async () => {
      const challengeId = "challengeId";
      const slackUserId = "slackUserId";
      const checkType = "vacation";
      const vacationPerMonth = 2;
      const cutoffHour = 18;

      const mockGetDailyChecks = jest
        .fn()
        .mockResolvedValue([
          { check_type: "vacation" },
          { check_type: "vacation" },
        ]);
      jest.mock("./challenges.service", () => ({
        getMonthPeriodForNow: jest
          .fn()
          .mockReturnValue({ start: new Date(), end: new Date() }),
      }));
      jest.mock("./daily-checks.service", () => ({
        getDailyChecks: mockGetDailyChecks,
      }));

      await expect(
        insertDailyCheck({
          challengeId,
          slackUserId,
          checkType,
          vacationPerMonth,
          cutoffHour,
        })
      ).rejects.toThrow(
        "You have already used all your vacations for the month"
      );
    });
  });
});
